#!/bin/sh
set -x
requirements_file="requirements.txt"

if [ ! -f "$requirements_file" ]; then
    echo "Error: File '$requirements_file' not found. Please ensure the file exists and try again."
    exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
    # Trim leading and trailing whitespace
    package=$(echo "$line" | xargs)
    # Skip empty lines and lines starting with '#'
    if [ -n "$package" ] && [ "${package#\#}" = "$package" ]; then
        echo "Adding dependency: $package"
        if rye add "$package"; then
            echo "Successfully added: $package"
        else
            echo "Error adding dependency: '$package'."
        fi
    fi
done < "$requirements_file"
