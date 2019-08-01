#!/bin/bash

# runs wp7.2-sp as the owner of the current directory
wp_cli() {
  local pwd_owner=$(stat -c '%U' .)
  local all_args=$@

  sudo -u $pwd_owner -i bash -c "wp7.2-sp --path="$PWD" $all_args"
}
