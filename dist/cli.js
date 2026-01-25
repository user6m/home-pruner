#!/usr/bin/env node

// src/modules/createBranch.ts
function createBranch(name, CurrntBranchName) {
  const isCurrent = name === CurrntBranchName;
  const branch = {
    name,
    isCurrent,
    isSelectable: !isCurrent,
    isSelected: false
    // TODO: make logic later
  };
  return branch;
}

// src/modules/buildLocalBranches.ts
function buildLocalBranches(currentBranchName, localBranchNames) {
  const formatted = localBranchNames.sort((a, b) => a.localeCompare(b, "en", { numeric: true })).map((name) => createBranch(name, currentBranchName));
  return formatted;
}

// src/cli.ts
import { execFileSync } from "node:child_process";

// src/errors/cli-error.ts
var CliError = class extends Error {
  code;
  userMessage;
  cause;
  constructor(opts) {
    super(opts.userMessage);
    this.name = "CliError";
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.cause = opts.cause;
  }
};
function isCliError(e) {
  return e instanceof CliError;
}
function toUnknownCliError(e) {
  if (isCliError(e)) return e;
  return new CliError({
    code: "UNKNOWN",
    userMessage: "Something went wrong.",
    cause: e
  });
}

// src/modules/printErrorAndSetExitCode.ts
var DEBUG = process.argv.includes("--debug");
function printErrorAndSetExitCode(e) {
  const err = toUnknownCliError(e);
  console.error(`[!Error]home-pruner: ${err.userMessage}`);
  process.exitCode = 1;
  if (DEBUG) {
    console.error("---- debug ----");
    console.error("code:", err.code);
    if (err.cause) console.error("cause:", err.cause);
    if (!isCliError(e) && e instanceof Error) console.error(e.stack);
    console.error("--------------");
  }
}

// src/cli.ts
function main() {
  const {
    currentBranchName: _currentBranchName,
    localBranchNames: _localBranchNames,
    branchList
  } = prepareBranches();
  const state = initializeState(branchList);
  console.log("Initial State:", state);
  const secondState = actionReducer(state, { type: "DOWN" });
  console.log("Second state:", secondState);
  const thirdState = actionReducer(state, { type: "UP" });
  console.log("Third state:", thirdState);
  const fourthState = actionReducer(state, { type: "TOGGLE" });
  console.log("Fouth state:", fourthState);
  const fifthState = actionReducer(state, { type: "TOGGLE" });
  console.log("Fifth state:", fifthState);
}
function prepareBranches() {
  const isGitRepo = (() => {
    try {
      execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
        stdio: "ignore"
      });
      return true;
    } catch {
      return false;
    }
  })();
  if (!isGitRepo) {
    throw new CliError({
      code: "NOT_GIT_REPO",
      userMessage: "You are not in the git repo."
    });
  }
  const currentBranchName = (() => {
    try {
      const result = execFileSync("git", ["branch", "--show-current"]);
      const formatted = result.toString().trim();
      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get current branch name.",
        cause: e
      });
    }
  })();
  const localBranchNames = (() => {
    try {
      const result = execFileSync("git", [
        "branch",
        "--format=%(refname:short)"
      ]);
      const formatted = result.toString().split("\n").filter(Boolean);
      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get local branches.",
        cause: e
      });
    }
  })();
  const branchList = buildLocalBranches(
    currentBranchName ?? "",
    localBranchNames ?? []
  );
  return {
    currentBranchName,
    localBranchNames,
    branchList
  };
}
function initializeState(branches) {
  return {
    branches,
    cursorIndex: 0
  };
}
function actionReducer(state, action) {
  const { branches, cursorIndex } = state;
  switch (action.type) {
    case "UP": {
      const next = Math.max(0, cursorIndex - 1);
      return next === cursorIndex ? state : { ...state, cursorIndex: next };
    }
    case "DOWN": {
      const last = Math.max(0, branches.length - 1);
      const next = Math.min(last, cursorIndex + 1);
      return next === cursorIndex ? state : { ...state, cursorIndex: next };
    }
    case "TOGGLE": {
      const current = branches[cursorIndex];
      if (!current) return state;
      if (!current.isSelectable) return state;
      const nextBranches = branches.map(
        (b, i) => i === cursorIndex ? { ...b, isSelected: !b.isSelected } : b
      );
      return { ...state, branches: nextBranches };
    }
  }
}
try {
  main();
} catch (e) {
  printErrorAndSetExitCode(e);
}
