# Custom DNS Server in Node.js

This is a basic custom DNS server implemented in Node.js with no external dependencies. It allows you to run a DNS server that can resolve domain names to IP addresses. You can use this DNS server for local testing or as a base for more advanced DNS server functionality.

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/Ilikepizza2/dns-server-node.git
   ```

2. Navigate to the project directory:

   ```bash
   cd dns-server-node
   ```

3. Install the necessary dependencies (there are none for this project):

   ```bash
   # There are no external dependencies
   ```

## Usage

1. Start the custom DNS server:

   ```bash
   sudo node ./dns-server.js
   ```

   This will start the DNS server on the default port 53.
   Note: sudo is required because ports<80 are only accessible through root previliges

2. Test the DNS server using the `dig` command. For example, to resolve the IP address of "example.com," run:

   ```bash
   dig example.com @127.0.0.1
   ```

   Replace `127.0.0.1` with the IP address of your DNS server if it's running on a different machine.

3. The DNS server should respond with the IP address associated with the domain name you queried.

4. You can verify the response by running

    ```bash
    dig example.com
    ```
    This will respond with the actual address from the server your machine points to.

## Customization

You can customize the DNS server behavior by editing the `index.js` file. For example, you can add your own DNS records or modify the server's behavior as needed for your project.

## Adding your own records
You can add the `.zone` file into the /zones/ directory. You can also parse any txt file by installing `dns-zonefile` and running the script `addZone.sh` which is included. This wasn't supported by default because I didn't want to include any external dependency. 

```bash
npm i dns-zonefile
chmod +x ./addZone.sh
./addZone.sh
```


