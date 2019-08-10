#!/bin/bash


# pipe the contents of the tmux clipboard into windows clipboard
tmux save-buffer - | clip

####################################################################
# useful script-y things I wrote to help w/ things

# given a file like:
#
# R: user-1/apps/app-a
# R: user-2/apps/app-b
# L: user-2/apps/app-c
# R: user-3/apps/app-d
# !: user-3/apps/app-e
# R: user-4/apps/app-f
# R: user-5/apps/app-g
# R: user-6/apps/app-h
# R: user-7/apps/app-i
# C: user-8/apps/app-j
# R: user-8/apps/app-k
# L: user-9/apps/app-l
#
# ?: -----------------------------------------
# ?: Unknown
# !: -----------------------------------------
# !: MAR - Manual action required
# -: -----------------------------------------
# -: N/A
# R: -----------------------------------------
# R: RDS
# L: -----------------------------------------
# L: LDS
# C: -----------------------------------------
# C: Cockpit (SQLite DB)

path_to_next_app_on_list() {
  local char="$1"
  echo $(grep -e "\($char: \).\+" /srv/users/apps -m 1 | cut -c 4-)
}
####################################################################

# get the size of each folder
du -cksh *

# list all apps
ls -1d */apps/*/

cd_to_app() {
  local app_name=$1
  local app_path=$(ls -1d /srv/users/*/apps/*/ | grep $app_name)

  echo $app_path
  cd $app_path
}
