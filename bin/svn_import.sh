#!/bin/bash

# Set up for automatic and manual usage
if [ "$#" -eq 0 ]; then
    # Automatic usage for docker
    SVN_TAG_DIRECTORY=$(cat /run/secrets/SVN_TAG_DIRECTORY)
    SVN_USERNAME=$(cat /run/secrets/SVN_USERNAME)
    SVN_PASSWORD=$(cat /run/secrets/SVN_PASSWORD)
    SVN_TAG=$( [ -f /run/secrets/SVN_TAG ] && cat /run/secrets/SVN_TAG )
elif [ $# -eq 3 ] || [ $# -eq 4 ]; then
    # Manual usage
    SVN_TAG_DIRECTORY="$1"
    SVN_USERNAME="$2"
    SVN_PASSWORD="$3"
    SVN_TAG="$4"
else
    echo "Manual usage: $0 <tag_directory> <username> <password> <optional:tag>"
    exit 1
fi

BIN_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

TABSINTCHA_JAR_DIR="${BIN_DIR}/../tabsintcha/android/libs"
FIRMWARE_DIR="${BIN_DIR}/../src/assets/firmware"

JAR_FILE="${TABSINTCHA_JAR_DIR}/CHA.jar"
WAHTS_FIRMWARE_FILE="${FIRMWARE_DIR}/CHA_firmware.dat"
WAHTS_FIRMWARE_METADATA_FILE="${FIRMWARE_DIR}/CHA_firmware.json"

# Exit if the directories do not exist.
for directory in "$TABSINTCHA_JAR_DIR" "$FIRMWARE_DIR"; do
    if [ ! -d "$directory" ]; then
        echo "${directory} does not exist."
        exit 1
    fi
done

# Remove existing files if found.
for file in "$JAR_FILE" "$WAHTS_FIRMWARE_FILE" "$WAHTS_FIRMWARE_METADATA_FILE"; do
    if [ -f "$file" ]; then
        echo "Removing the pre-existing ${file}."
        rm "$file"
    fi
done

# Check if we have a tag specified and if not determine the tag
if [ -z "$SVN_TAG" ]; then
    echo "No tag provided. Finding the latest available tag."
    # Formatted as YYYY-MM-DD_tag 
    TAG_MATCH="[0-9]{4}-[0-9]{2}-[0-9]{2}_"
    # Retrieve tags and filter to find the latest available matching tag
    SVN_TAG=$(svn list "$SVN_TAG_DIRECTORY" --username "$SVN_USERNAME" --password "$SVN_PASSWORD" --non-interactive --trust-server-cert | grep -E "$TAG_MATCH" | sort | tail -n 1)
    
    if [ -z "$SVN_TAG" ]; then
        echo "Failed to automatically find a tag."
        exit 1
    fi
fi

# Pull the new JAR file from SVN
BASE_SVN_PATH="${SVN_TAG_DIRECTORY}${SVN_TAG}"

echo "Pulling the new JAR file."
svn export "${BASE_SVN_PATH}/Android/CHA/bin/CHA.jar" "$TABSINTCHA_JAR_DIR" --username "$SVN_USERNAME" --password "$SVN_PASSWORD" --non-interactive --trust-server-cert

# Pull the new WAHTS firmware file from SVN
echo "Pulling the new WAHTS firmware file."
svn export "${BASE_SVN_PATH}/DSP/C5515/CHA/bin/Release/CHA_firmware.dat" "$FIRMWARE_DIR" --username "$SVN_USERNAME" --password "$SVN_PASSWORD" --non-interactive --trust-server-cert

for file in "$JAR_FILE" "$WAHTS_FIRMWARE_FILE"; do
    if [ ! -f "$file" ]; then
        echo "Failed to pull file for ${file}."
        exit 1
    fi
done

# Keep only printable characters and squeeze spaces
WAHTS_DATA=$(iconv -f utf-8 -t ascii//IGNORE -c $WAHTS_FIRMWARE_FILE | tr -d '\000-\037\177-\377' | tr -d '\n\r\t\b' | tr -s ' ')
WAHTS_DATETIME=$(echo "$WAHTS_DATA" | grep -oP '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s[0-9]{1,2}\s[0-9]{4}\s[0-9]{2}:[0-9]{2}:[0-9]{2}')
if [[ -z "$WAHTS_DATETIME" ]]; then
    echo "No WAHTS metadata date found."
    exit 1
fi

# Create a metadata file for the WAHTS firmware
WAHTS_JSON_STRING="{\"tag\":\"${SVN_TAG}\",\"time\":\"${WAHTS_DATETIME}\"}"
echo "${WAHTS_JSON_STRING}" > "${WAHTS_FIRMWARE_METADATA_FILE}"

echo "Successfully generated the files."
exit 0