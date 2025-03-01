#!/bin/bash

# Check if filename was provided
if [ $# -eq 0 ]; then
    echo "Please provide a filename (without extension)"
    echo "Usage: $0 filename"
    exit 1
fi

# Get filename from argument
myfilename="$1"

# Check if the docx file exists
if [ ! -f "${myfilename}.docx" ]; then
    echo "Error: ${myfilename}.docx does not exist."
    exit 1
fi

# Create attachments directory if it doesn't exist
mkdir -p "./attachments/${myfilename}"

# Convert docx to markdown
pandoc \
    -t markdown_strict \
    --extract-media="./attachments/${myfilename}" \
    "${myfilename}.docx" \
    -o "${myfilename}.md"

# Check if conversion was successful
if [ $? -eq 0 ]; then
    echo "Conversion successful! Output file: ${myfilename}.md"
    echo "Media files extracted to: ./attachments/${myfilename}"
else
    echo "Conversion failed."
fi