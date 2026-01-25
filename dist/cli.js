#!/usr/bin/env node

// src/cli.ts
import { execFileSync } from "node:child_process";
function validateInsideGitRepo() {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
}
function getCurrentBranchName() {
  try {
    const result = execFileSync("git", ["branch", "--show-current"]);
    const formatted = result.toString().trim();
    return formatted;
  } catch (e) {
    console.error("Cannot get current branch. Error:", e);
    return;
  }
}
var isInsideGitRepo = validateInsideGitRepo();
if (!isInsideGitRepo) {
  console.log("You are not in the git repo");
} else {
  const current = getCurrentBranchName();
  console.log("Current branch is:", current);
}
