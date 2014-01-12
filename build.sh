#!/bin/bash
# build.sh -- builds JAR and XPI files for mozilla extensions
#   by Nickolay Ponomarev <asqueella@gmail.com>
#   (original version based on Nathan Yergler's build script)
# Most recent version is at <http://kb.mozillazine.org/Bash_build_script>

# This script assumes the following directory structure:
# ./
#   chrome.manifest (optional - for newer extensions)
#   install.rdf
#   (other files listed in $ROOT_FILES)
#
#   content/    |
#   locale/     |} these can be named arbitrary and listed in $CHROME_PROVIDERS
#   skin/       |
#
#   defaults/   |
#   components/ |} these must be listed in $ROOT_DIRS in order to be packaged
#   ...         |
#
# It uses a temporary directory ./build when building; don't use that!
# Script's output is:
# ./$APP_NAME.xpi
# ./$APP_NAME.jar  (only if $KEEP_JAR=1)
# ./files -- the list of packaged files
#
# Note: It modifies chrome.manifest when packaging so that it points to 
#       chrome/$APP_NAME.jar!/*

#
# default configuration file is ./config_build.sh, unless another file is 
# specified in command-line. Available config variables:
APP_NAME=          # short-name, jar and xpi files name. Must be lowercase with no spaces
CHROME_PROVIDERS=  # which chrome providers we have (space-separated list)
CLEAN_UP=          # delete the jar / "files" when done?       (1/0)
USE_JAR=           # put chrome providers to jar (1/0)
ROOT_FILES=        # put these files in root of xpi (space separated list of leaf filenames)
ROOT_DIRS=         # ...and these directories       (space separated list)
BEFORE_BUILD=      # run this before building       (bash command)
AFTER_BUILD=       # ...and this after the build    (bash command)

config=./config_build.sh
OPTIND=1
while getopts "c:" opt; do
    case "$opt" in
    c)  config=$OPTARG
        ;;
    esac
done

# load config
. $config

if [ -z $APP_NAME ]; then
  echo "You need to create build config file first!"
  echo "Read comments at the beginning of this script for more info."
  exit;
fi

ROOT_DIR=`pwd`
OUTPUT_DIR=$ROOT_DIR/output
TMP_DIR=$OUTPUT_DIR/build
FILES_DIR=$OUTPUT_DIR/files

#uncomment to debug
#set -x

# remove any left-over files from previous build
rm -f $OUTPUT_DIR/$APP_NAME.jar $OUTPUT_DIR/$APP_NAME.xpi $OUTPUT_DIR/files
rm -rf $TMP_DIR

$BEFORE_BUILD

mkdir --parents --verbose $TMP_DIR/chrome

for CHROME_SUBDIR in $CHROME_PROVIDERS; do
  find $CHROME_SUBDIR -path '*CVS*' -prune -o -type f -print | grep -v \~ >> $FILES_DIR
done

if [ $USE_JAR != 0 ]; then
    # generate the JAR file, excluding CVS and temporary files
    JAR_FILE=$TMP_DIR/chrome/$APP_NAME.jar
    echo "Generating $JAR_FILE..."
    zip -0 -r $JAR_FILE `cat $FILES_DIR`
else
    # The following statement should be used instead if you don't wish to use the JAR file
    echo "Copying Chrome files to $TMP_DIR folder..."
    cp --verbose --parents `cat $FILES_DIR` $TMP_DIR
fi

# prepare components and defaults
echo "Copying various files to $TMP_DIR folder..."
for DIR in $ROOT_DIRS; do
  mkdir $TMP_DIR/$DIR
  FILES="`find $DIR -path '*CVS*' -prune -o -type f -print | grep -v \~`"
  echo $FILES >> files
  cp --verbose --parents $FILES $TMP_DIR
done

# Copy other files to the root of future XPI.
for ROOT_FILE in $ROOT_FILES install.rdf chrome.manifest; do
  cp --verbose $ROOT_FILE $TMP_DIR
  if [ -f $ROOT_FILE ]; then
    echo $ROOT_FILE >> $FILES_DIR
  fi
done

$BEFORE_PACK

cd $TMP_DIR

if [[ $USE_JAR != 0 && -f "chrome.manifest" ]]; then
  echo "Preprocessing chrome.manifest..."
  # You think this is scary?
  #s/^(content\s+\S*\s+)(\S*\/)$/\1jar:chrome\/$APP_NAME\.jar!\/\2/
  #s/^(skin|locale)(\s+\S*\s+\S*\s+)(.*\/)$/\1\2jar:chrome\/$APP_NAME\.jar!\/\3/
  #
  # Then try this! (Same, but with characters escaped for bash :)
  sed -i -r s/^\(content\|resource\)\(\\s+\\S*\\s+\)\(\\S*\\/\)/\\1\\2jar:chrome\\/$APP_NAME\\.jar!\\/\\3/ chrome.manifest
  sed -i -r s/^\(skin\|locale\)\(\\s+\\S*\\s+\\S*\\s+\)\(.*\\/\)/\\1\\2jar:chrome\\/$APP_NAME\\.jar!\\/\\3/ chrome.manifest
  # (it simply adds jar:chrome/whatever.jar!/ at appropriate positions of chrome.manifest)
fi

# generate the XPI file
echo "Generating $APP_NAME.xpi..."
zip -r $OUTPUT_DIR/$APP_NAME.xpi *

cd "$ROOT_DIR"

echo "Cleanup..."
if [ $CLEAN_UP = 0 ]; then
  # save the jar file
  if [ -f $TMP_DIR/chrome/$APP_NAME.jar ]; then
    mv $TMP_DIR/chrome/$APP_NAME.jar $OUTPUT_DIR
  fi
else
  rm $FILES_DIR
fi

# remove the working files
rm -rf $TMP_DIR
echo "Done!"

$AFTER_BUILD
