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

// src/modules/buildColor.ts
var RESET = "\x1B[0m";
function wrap(code) {
  return (text) => `${code}${text}${RESET}`;
}
var red = wrap("\x1B[31m" /* RED */);
var green = wrap("\x1B[32m" /* GREEN */);
var gray = wrap("\x1B[90m" /* GRAY */);
var cyan = wrap("\x1B[36m" /* CYAN */);
var reverse = wrap("\x1B[7m" /* REVERSE */);

// src/cli.ts
function main() {
  const { branchList } = prepareBranches();
  let state = initializeState(branchList);
  const { stdin } = prepareStdInOut();
  render(state);
  const onData = (key) => {
    const s = typeof key === "string" ? key : key.toString("utf-8");
    if (s === "" /* CTRL_C */ || s === "q") {
      stdin.off("data", onData);
      cleanup();
      return;
    }
    let action = null;
    action = (() => {
      switch (s) {
        case "\x1B[A" /* ARROW_UP */:
        case "i":
          return { type: "UP" };
        case "\x1B[B" /* ARROW_DOWN */:
        case "k":
          return { type: "DOWN" };
        case " ":
          return { type: "TOGGLE" };
        default:
          return null;
      }
    })();
    if (!action) return;
    state = actionReducer(state, action);
    render(state);
  };
  stdin.on("data", onData);
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
function getSelectedBranchNames(state) {
  return state.branches.filter((b) => b.isSelected).map((b) => b.name);
}
function actionReducer(state, action) {
  const { branches, cursorIndex } = state;
  switch (action.type) {
    case "UP": {
      const newIndex = Math.max(0, cursorIndex - 1);
      return newIndex === cursorIndex ? state : { ...state, cursorIndex: newIndex };
    }
    case "DOWN": {
      const lastIndex = Math.max(0, branches.length - 1);
      const newIndex = Math.min(lastIndex, cursorIndex + 1);
      return newIndex === cursorIndex ? state : { ...state, cursorIndex: newIndex };
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
    case "QUIT":
      process.stdin.off("data", actionReducer);
      cleanup();
      return state;
    case "INVALID":
      return state;
  }
}
var dict = {
  banner: `
=================
|| home-pruner ||
=================
`,
  currentGitRepo: (name) => `*Current git repository : ${green(name)}
`,
  currentBranchNum: (num) => `*Local branches count   : ${green(num)}
`
};
function render(state) {
  const focused = state.branches[state.cursorIndex];
  const selected = getSelectedBranchNames(state);
  const stdout = process.stdout;
  const currentGitRepoName = (() => {
    try {
      const result = execFileSync("git", ["rev-parse", "--show-toplevel"]);
      const formatted = result.toString().trim();
      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get git repo name",
        cause: e
      });
    }
  })();
  const builder = [];
  builder.push("\x1B[2J" /* CLEAR_SCREEN */);
  builder.push("\x1B[H" /* MOVE_CURSOR_HOME */);
  builder.push(dict.banner);
  builder.push(dict.currentGitRepo(currentGitRepoName));
  builder.push(dict.currentBranchNum((state.branches.length ?? 0).toString()));
  stdout.write(builder.join(""));
}
function prepareStdInOut() {
  const stdin = process.stdin;
  const stdout = process.stdout;
  stdout.write("\x1B[?1049h" /* ENTER_ALT_SCREEN */);
  stdout.write("\x1B[?25l" /* HIDE_PIPE */);
  stdout.write("\x1B[H" /* MOVE_CURSOR_HOME */);
  stdin.setEncoding("utf-8");
  stdin.setRawMode(true);
  return {
    stdin,
    stdout
  };
}
function cleanup() {
  const stdout = process.stdout;
  const stdin = process.stdin;
  try {
    stdout.write("\x1B[?1049l" /* EXIT_ALT_SCREEN */);
    stdout.write("\x1B[?25h" /* SHOW_PIPE */);
    stdout.write("\n");
  } finally {
    if (stdin.isRaw) stdin.setRawMode(false);
    stdin.pause();
  }
}
try {
  main();
} catch (e) {
  printErrorAndSetExitCode(e);
}
