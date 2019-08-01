#!/bin/bash


# pipe the contents of the tmux clipboard into windows clipboard
tmux save-buffer - | clip
