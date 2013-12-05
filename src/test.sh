#!/bin/bash
OPTIND=1
while getopts "t" opt; do
    case "$opt" in
    t) echo "Executing EDS Calendar tests..."
       mozmill -p $OUTPUT_DIR/test/profile --app thunderbird -b /usr/bin/thunderbird -a $OUTPUT_DIR/$APP_NAME.xpi -t $ROOT_DIR/tests/mozmill --manual
       ;; 
    esac
done
