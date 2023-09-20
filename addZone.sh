#!/bin/bash
# This is a script to take a file path as input and use it in a Linux command

# Prompt the user for a file path
read -p "Enter the path of the file: " file_path

# Check if the file exists
if [ -f "$file_path" ]; then
    # Replace 'your_command_here' with the actual command you want to run,
    # using the input file path
    zonefile -p "$file_path" > "$file_path.zone"
    
    # Exit the script
    exit 0
else
    echo "File not found at '$file_path'"
    exit 1
fi
