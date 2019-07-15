#!/usr/bin/env bash

###########################################################
echo "you should not run this as an actual script!" && exit
###########################################################

## This is mainly about cleaning up git repos where you've got lots of merged branches, in a gitflow setup
# I can't think of a good way to make it a nice alias :/

# list all branches that are merged in *both* origin/master & origin/production
comm <(git branch -r --merged origin/master) <(git branch -r --merged origin/production) -12

# list all branches that are merged in *neither* origin/master & origin/production
comm <(git branch -r --no-merged origin/master) <(git branch -r --no-merged origin/production) -12

# list all branches that are merged in both branches, plus filter them using awk
comm <(git branch -r --merged origin/master) <(git branch -r --merged origin/production) -12 | awk -F/ '/\/feature\/add-/{print $2"/"$3}'

# list all branches that are merged in both branches, plus filter them using awk, and then delete them!
# comm <(git branch -r --merged origin/master) <(git branch -r --merged origin/production) -12 | awk -F/ '/\/feature\/access/{print $2"/"$3}' | xargs -I % git push origin --delete %
