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
JAR_DIR="$BIN_DIR/../tabsintcha/android/libs/"
JAR_FILE="$BIN_DIR/../tabsintcha/android/libs/CHA.jar"

# Exit if the directory does not exist.
if [ ! -d "$JAR_DIR" ]; then
  echo "$JAR_DIR does not exist."
  exit 1
fi

# Remove the current JAR file if it is found.
if [ -f "$JAR_FILE" ]; then
    echo "Removing the pre-existing JAR file."
    rm "$JAR_FILE"
fi

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
echo "Pulling the new JAR file."
    svn export "$SVN_TAG_DIRECTORY""$SVN_TAG"/Android/CHA/bin/CHA.jar "$JAR_DIR" --username "$SVN_USERNAME" --password "$SVN_PASSWORD" --non-interactive --trust-server-cert

if [ -f "$JAR_FILE" ]; then
    echo "Successfully pulled the JAR file."
else
    echo "Failed to pull the JAR file."
    exit 1
fi
