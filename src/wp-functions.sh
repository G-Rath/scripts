#!/bin/bash

# runs wp7.2-sp as the owner of the current directory
wp_cli() {
  # not the most portable method, but it'll do...
  local pwd_owner=$(stat -c '%U' .)
  local all_args=$@
  local path=$PWD

  # respect configu path if present
  if [ -f "wp-cli.yml" ]; then
     path=$path/$(grep -Po "path: \K.+" wp-cli.yml)
  fi

  sudo -u "$pwd_owner" -i bash -c "wp7.2-sp --path="$path" $all_args"
}
