#!/bin/sh

# Function to calculate md5 hash of package.json
calculate_md5() {
    md5sum package.json | awk '{ print $1 }'
}

# Initial md5 hash
last_md5=$(calculate_md5)

# Monitor package.json for changes
while true; do
    current_md5=$(calculate_md5)
    if [ "$current_md5" != "$last_md5" ]; then
        echo "package.json has changed. Running npm install..."
        npm install
        last_md5=$current_md5
    fi
    sleep 5
done