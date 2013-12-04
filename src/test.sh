#!/bin/bash
OPTIND=1
while getopts "t" opt; do
    case "$opt" in
    t) echo "Executing EDS Calendar tests..."
       mozmill -p dev --app thunderbird -b /usr/bin/thunderbird -a $APP_NAME.xpi -t ./tests/mozmill/test-calEdsProvider.js
       ;; 
    esac
done
