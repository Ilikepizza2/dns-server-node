#!/bin/bash
# This is a script to take a file path as input and run the 'zonefile' command with the input file path

# Prompt the user for a file path
read -p "Enter the path of the file: " file_path

# Check if the file exists
if [ -f "$file_path" ]; then
    # Define the output file path with a .zone extension
    output_file_path="${file_path}.zone"
    
    # Run the 'zonefile' command with the provided file path and output to the new file
    npx zonefile -p "$file_path" > "$output_file_path"
    
    # Exit the script
    exit 0
else
    echo "File not found at '$file_path'"
    exit 1
fi
