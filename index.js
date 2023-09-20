const dgram = require('dgram');
const { EventEmitter } = require('events');
const { Buffer } = require('buffer');
const fs = require('fs');
const server = dgram.createSocket('udp4');

const PORT = 53;

ip = "127.0.0.1";

sock = server.on('error', (error) => {
    console.log(`Error: ${error}`);
    sock.close();
});


const load_zones = () => {
    const zonedir = './zones/';
    let data = {};
    let jsontext = "";
    fs.readdirSync(zonedir).forEach((zonefile) => {
        if(!zonefile.endsWith('.zone')) {
            return;
        }
        jsontext = "";
        const zone = fs.readFileSync(zonedir + zonefile, 'utf-8').split('\n');
        zone.forEach((line) => {
            if (line.length) {
                if (line[0] === ';') {
                    return;
                }
                jsontext += line;
            }
        });
        // console.log(JSON.parse(jsontext));
        const json = JSON.parse(jsontext);
        let zonename = json['$origin'];
        if(zonename === undefined) {
            zonename = json['soa']['mname'];
        }
        if(zonename === undefined) return;
        data[zonename] = json;
    });
    return data;
}

const zoneData = load_zones();
// console.log(zoneData);

const getFlags = (flags) => {
    const rflags = '';
    const QR = '1';
    const byte1 = flags.slice(0,1);
    const byte2 = flags.slice(1, 2);

    console.log("byte 1: ", byte1);
    console.log("byte 2: ", byte2);

    let OPCODE = "";
    for (let i = 6; i >= 3; i--) {   // check this loop (might be wrong)
        // OPCODE += toString(parseInt(byte1.toString('hex')) & (1<<i));
        // console.log( (parseInt(byte2.toString('hex'), 16) & (1 << i)));
        OPCODE += (parseInt(byte1.toString('hex'), 16) & (1 << i)) ? '1' : '0';
    }
    // console.log(OPCODE);

    AA = '1';
    TC = '0';
    RD = '0';
    RA = '0';
    Z = '000';
    RCODE = '0000';

    const resbyte1 = parseInt(QR + OPCODE + AA + TC + RD, 2);
    const resbyte2 = parseInt(RA + Z + RCODE, 2);

    const res1 = Buffer.from(resbyte1.toString(16), 'hex');

    const res2 = Buffer.from([0]);
    
    console.log("res1: ", res1, "res2: ", res2);
    const res = Buffer.concat([res1, res2]);
    // res skips
    console.log("res", res);
    return res;
}

const getQuestionDomain = (data) => {
    let domain = '';
    let iterator = 0;
    let domainParts = [];
    while (true) {
        const byte = data.slice(iterator, iterator + 1);
        let length = 0;
        if (byte.toString('hex') === '00') {
            break;
        } else {
            length = parseInt(byte.toString('hex'), 16);
            domain = data.slice(iterator + 1, iterator + length + 1).toString('ascii') + '.';
            domainParts.push(domain);
        }
        iterator += length + 1;
    }
    // for removing the last dot after com -> www.google.com. to www.google.com
    // domainParts[domainParts.length-1] = domainParts[domainParts.length-1].slice(0, domainParts[domainParts.length-1].length - 1);
    // console.log("domain: ", domainParts)
    
    const questiontype = data.slice(iterator + 1, iterator + 3);
    return [domainParts, questiontype];
}

const getZone = (domainParts, qt) => {
    const zone_name = domainParts.join('');
    console.log("zone_name: ", zone_name);
    if(zoneData[zone_name] === undefined) {
        return;
    }
    console.log("zoneData: ", zoneData[zone_name][qt]);
    return zoneData[zone_name][qt];
}

const getRecs = (data) => {
    const [domain, questiontype] = getQuestionDomain(data);
    
    console.log("domain: ", domain);

    let at = '';
    let qt = '';
    if (questiontype.toString('hex') === '0001') {
        qt = 'a';
    }

    const zone = getZone(domain, qt);
    if(zone === undefined) {
        return [[], qt, domain];
    }
    return [zone, qt, domain];
}

const buildQuestion = (domain, qt) => {
    const qbytes = [];

    domain.forEach((part) => {
        const length = Math.max(part.length-1, 0);
        qbytes.push(length);

        for (let i = 0; i < length; i++) {
            qbytes.push(part.charCodeAt(i));
        }
        // if(length!=0)
        // qbytes.pop();
    });
    if (qt === 'a') {
        qbytes.push(0x00);
        qbytes.push(0x00);
        qbytes.push(0x01);
    }
    qbytes.push(0x00);
    qbytes.push(0x01);
    
    return qbytes;
}

const rectobytes = (domain, qt, ttl, value) => {
    const rbytes = [];
    // console.log("hello\n");
    rbytes.push(0xc0);
    rbytes.push(0x0c);
    if (qt === 'a') {
        rbytes.push(0x00);
        rbytes.push(0x01);
    }
    rbytes.push(0x00);
    rbytes.push(0x01);
    // push the TTL from the parameters
    rbytes.push(ttl >> 24 & 0xFF);
    rbytes.push(ttl >> 16 & 0xFF);
    rbytes.push(ttl >> 8 & 0xFF);
    rbytes.push(ttl & 0xFF);
    if(qt === 'a') {
        rbytes.push(0x00);
        rbytes.push(0x04);
        value.split('.').forEach((part) => {
            rbytes.push(parseInt(part));
        });
    }
    // console.log("rbytes",Buffer.from(rbytes));
    return Buffer.from(rbytes);
}

const getResponse = (data) => {
    const TransactionID = [data[0], data[1]];
    const TransactionIDBytes = Buffer.from(TransactionID, 'hex');
    console.log("TransactionIDBytes: ", TransactionIDBytes);
    const Flags = getFlags(data.slice(2, 4));

    const QDCOUNT = Buffer.from([0x00, 0x01, 'hex']);
    



    const ANCOUNT = (getRecs(data.slice(12, data.length - 4))[0].length);
    const NSCOUNT = 0;
    const ARCOUNT = 0;
    console.log("ANCOUNT: ", ANCOUNT);
    const COUNT_FLAGS = Buffer.from([ANCOUNT, NSCOUNT, 0, 0, ARCOUNT]);
    console.log(TransactionIDBytes, Flags, QDCOUNT, COUNT_FLAGS)
    const dnsHeader = Buffer.concat([TransactionIDBytes, Flags, QDCOUNT, COUNT_FLAGS]);
    console.log("dnsHeader: ", dnsHeader);

    [records, qt, domain] = getRecs(data.slice(12, data.length - 4));
    
    const dnsQuestion = buildQuestion(domain, qt);
    let dnsBody = [];
    records.forEach((record) => {
        // console.log(rectobytes(domain, qt, record["ttl"], record["ip"]))
        // if(dnsBody.length === 0)
        dnsBody.push(rectobytes(domain, qt, record["ttl"], record["ip"]));
    })
    const dnsBodyBytes = Buffer.concat(dnsBody);
    const dnsQuestionBytes = Buffer.from(dnsQuestion);
    console.log("dnsBody: ",dnsHeader, dnsBodyBytes, dnsQuestionBytes);
    
    return Buffer.concat([dnsHeader, dnsQuestionBytes, dnsBodyBytes]);
}

server.on('message', (msg, rinfo) => {
    // console.log(`Message: ${msg} from ${rinfo.address}:${rinfo.port}`);
    if (msg.length > 512) {
        console.log("Message too long");
        return;
    }
    console.log(msg)
    const res = getResponse(msg);
    server.send(res, rinfo.port, rinfo.address, (error) => {
        if (error) {
            console.log(error);
            server.close();
        } else {
            // console.log(`Message sent`);
        }
    });
});

server.on('listening', () => {
    const address = server.address();
    console.log(`Server listening on ${address.address}:${address.port}`);
});

server.bind(PORT, ip);
// console.log(Buffer.from([0x01], 'hex'))