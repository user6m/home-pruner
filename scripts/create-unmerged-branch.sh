#!/bin/bash

# Script to create a branch with unmerged changes for debugging home-pruner error handling.

BRANCH_NAME="debug/unmerged-$(date +%s)"
DUMMY_FILE="debug_unmerged_$(date +%s).txt"

echo "Creating unmerged branch: $BRANCH_NAME"

# 1. Create and switch to new branch
git checkout -b "$BRANCH_NAME"

# 2. Make a dummy change and commit it
touch "$DUMMY_FILE"
git add "$DUMMY_FILE"
git commit -m "Add unmerged changes for debugging"

# 3. Switch back to main (or the branch we were on)
git checkout -

echo "------------------------------------------------"
echo "Done! Branch '$BRANCH_NAME' created and ready for testing."
echo "Attempting to delete this with 'git branch -d $BRANCH_NAME' will fail."
echo "------------------------------------------------"
