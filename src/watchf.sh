#!/usr/bin/env bash

# usage: watchf file1 file2 <etc>
# prints the contents of the given files whenever the dir changes

print_file_contents() {
  echo $(date)" - $PWD"

  for var in $@
  do
    echo "./"$var":"
    cat $var
  done
}

clear
print_file_contents $@

inotifywait -q -m -e modify,create . |
while read -r filename event; do
  clear
  print_file_contents $@
done
