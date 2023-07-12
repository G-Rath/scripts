#!/usr/bin/env bash

# Ensures that all active repos within the given organisation are set
# to delete branches on merge, using the gh cli
#
# https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches

set -e

gh_org=${1?'should be the name of a GitHub organisation'}
limit=${2-1000}

repos=$(
  gh repo list "$gh_org" \
    --no-archived \
    --limit "$limit" \
    --json name,deleteBranchOnMerge \
    --jq '.[] | select(.deleteBranchOnMerge | not) | .name'
)

for repo in $repos; do
  gh repo edit "$gh_org/$repo" --delete-branch-on-merge
done

