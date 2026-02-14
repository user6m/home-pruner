#!/usr/bin/env node

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

// src/modules/getLocalBranches.ts
import { execFileSync } from "node:child_process";

// src/modules/createBranch.ts
function createBranch(name, CurrntBranchName) {
  const isCurrent = name === CurrntBranchName;
  const branch = {
    name,
    isCurrent,
    isSelectable: !isCurrent,
    isSelected: false
  };
  return branch;
}

// src/modules/buildLocalBranches.ts
function buildLocalBranches(currentBranchName, localBranchNames) {
  const formatted = localBranchNames.sort((a, b) => a.localeCompare(b, "en", { numeric: true })).map((name) => createBranch(name, currentBranchName));
  return formatted;
}

// src/modules/postprocess.ts
function postprocess() {
  const stdout = process.stdout;
  const stdin = process.stdin;
  const builder = [];
  builder.push("\x1B[?1049l" /* EXIT_ALT_SCREEN */);
  builder.push("\x1B[?25h" /* SHOW_PIPE */);
  stdout.write(builder.join(""));
  if (stdin.isRaw) stdin.setRawMode(false);
  stdin.pause();
}

// src/modules/getLocalBranches.ts
function getLocalBranches() {
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
    postprocess();
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
      postprocess();
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
      postprocess();
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
  return branchList;
}

// src/modules/colorWrapper.ts
var RESET = "\x1B[0m";
function wrap(code) {
  return (text) => `${code}${text}${RESET}`;
}
var red = wrap("\x1B[31m" /* RED */);
var green = wrap("\x1B[32m" /* GREEN */);
var gray = wrap("\x1B[90m" /* GRAY */);
var cyan = wrap("\x1B[36m" /* CYAN */);
var reverse = wrap("\x1B[7m" /* REVERSE */);

// src/const/dict.ts
var dict = {
  banner: `
=================
|| home-pruner ||
=================
`,
  currentGitRepo: (name) => `*Current git repository : ${green(name)}
`,
  currentBranchNum: (num) => `*Local branches count   : ${green(num)}
`,
  instruction: "[!!] Press [Enter] to delete, [f] to force delete",
  deletedBranch: (name) => `Deleted branch: ${name}`,
  failedToDelete: (detail) => `Failed to delete branch. ${detail}`,
  failedToForceDelete: (detail) => `Failed to force delete branch. ${detail}`
};

// src/modules/actionReducer.ts
import { execFileSync as execFileSync2 } from "node:child_process";
function actionReducer(state, action) {
  const { branches, cursorIndex } = state;
  switch (action.type) {
    case "UP": {
      const newIndex = Math.max(0, cursorIndex - 1);
      return newIndex === cursorIndex ? { ...state, message: void 0 } : { ...state, cursorIndex: newIndex, message: void 0 };
    }
    case "DOWN": {
      const lastIndex = Math.max(0, branches.length - 1);
      const newIndex = Math.min(lastIndex, cursorIndex + 1);
      return newIndex === cursorIndex ? { ...state, message: void 0 } : { ...state, cursorIndex: newIndex, message: void 0 };
    }
    case "TOGGLE": {
      const targetBranch = branches[cursorIndex];
      if (!targetBranch) return state;
      if (!targetBranch.isSelectable) return state;
      if (targetBranch.isSelected) {
        try {
          execFileSync2("git", ["branch", "-d", `${targetBranch.name}`], {
            stdio: "pipe"
          });
          const localBranches = getLocalBranches();
          const newCursorIndex = localBranches.length === 0 ? 0 : Math.min(cursorIndex, localBranches.length - 1);
          return {
            ...state,
            branches: localBranches,
            cursorIndex: newCursorIndex,
            message: {
              type: "success",
              text: dict.deletedBranch(targetBranch.name)
            }
          };
        } catch (e) {
          const detail = e instanceof Error && e.stderr ? e.stderr.toString().trim() : e instanceof Error ? e.message : String(e);
          const nextBranches2 = branches.map(
            (b, i) => i === cursorIndex ? { ...b, isSelected: false } : b
          );
          return {
            ...state,
            branches: nextBranches2,
            message: {
              type: "error",
              text: dict.failedToDelete(detail)
            }
          };
        }
      }
      const nextBranches = branches.map(
        (b, i) => i === cursorIndex ? { ...b, isSelected: !b.isSelected } : b
      );
      return { ...state, branches: nextBranches, message: void 0 };
    }
    case "FORCE_DELETE": {
      const targetBranch = branches[cursorIndex];
      if (!targetBranch || !targetBranch.isSelected) return state;
      try {
        execFileSync2("git", ["branch", "-D", `${targetBranch.name}`], {
          stdio: "pipe"
        });
        const localBranches = getLocalBranches();
        const newCursorIndex = localBranches.length === 0 ? 0 : Math.min(cursorIndex, localBranches.length - 1);
        return {
          ...state,
          branches: localBranches,
          cursorIndex: newCursorIndex,
          message: {
            type: "success",
            text: dict.deletedBranch(targetBranch.name)
          }
        };
      } catch (e) {
        const detail = e instanceof Error && e.stderr ? e.stderr.toString().trim() : e instanceof Error ? e.message : String(e);
        return {
          ...state,
          message: {
            type: "error",
            text: dict.failedToForceDelete(detail)
          }
        };
      }
    }
  }
  return state;
}

// src/modules/render.ts
import { execFileSync as execFileSync3 } from "child_process";
function render(branchState) {
  const stdout = process.stdout;
  const focused = branchState.branches[branchState.cursorIndex];
  const terminalHeight = stdout.rows;
  const headerHeight = 5;
  const visibleRows = terminalHeight - headerHeight;
  const focusedIndex = branchState.cursorIndex;
  const currentGitRepoName = (() => {
    try {
      const result = execFileSync3("git", ["rev-parse", "--show-toplevel"]);
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
  const currentBranchName = (() => {
    try {
      const result = execFileSync3("git", ["branch", "--show-current"]);
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
  let startIndex = 0;
  if (focusedIndex >= visibleRows) {
    startIndex = focusedIndex - visibleRows + 1;
  }
  const builder = [];
  builder.push("\x1B[2J" /* CLEAR_SCREEN */);
  builder.push("\x1B[H" /* MOVE_CURSOR_HOME */);
  builder.push(dict.banner);
  builder.push(dict.currentGitRepo(currentGitRepoName));
  builder.push(
    dict.currentBranchNum((branchState.branches.length ?? 0).toString())
  );
  builder.push(
    branchState.branches.slice(startIndex, startIndex + visibleRows).map((b) => {
      const name = b.name;
      const suffix = (() => {
        const result = [];
        if (name === currentBranchName) result.push("(current)");
        if (b.isSelected) result.push(dict.instruction);
        return result;
      })();
      const context = name + " " + suffix;
      if (name === focused?.name) return reverse(context);
      if (name === currentBranchName) return green(context);
      return name;
    }).join(`
`)
  );
  if (branchState.message) {
    const text = `

${branchState.message.text}`;
    builder.push(
      branchState.message.type === "error" ? red(text) : green(text)
    );
  }
  stdout.write(builder.join(""));
}

// src/main.ts
function main() {
  const stdin = process.stdin;
  const branches = getLocalBranches();
  let branchState = {
    branches,
    cursorIndex: 0
  };
  const onData = (key) => {
    const input = typeof key === "string" ? key : key.toString("utf-8");
    if (input === "" /* CTRL_C */ || input === "q") {
      stdin.off("data", onData);
      postprocess();
      return;
    }
    const resetSelection = () => {
      branchState.branches = branchState.branches.map((b) => {
        return { ...b, isSelected: false };
      });
    };
    const action = (() => {
      switch (input) {
        case "\x1B[A" /* ARROW_UP */:
        case "i":
          resetSelection();
          return { type: "UP" };
        case "\x1B[B" /* ARROW_DOWN */:
        case "k":
          resetSelection();
          return { type: "DOWN" };
        case "\r" /* ENTER */:
        case " ":
          return { type: "TOGGLE" };
        case "f":
          return { type: "FORCE_DELETE" };
        default:
          resetSelection();
          return null;
      }
    })();
    if (!action) return;
    branchState = actionReducer(branchState, action);
    render(branchState);
  };
  preprocess(branchState);
  stdin.on("data", onData);
}
function preprocess(branchState) {
  const stdin = process.stdin;
  const stdout = process.stdout;
  const builder = [];
  builder.push("\x1B[?1049h" /* ENTER_ALT_SCREEN */);
  builder.push("\x1B[?25l" /* HIDE_PIPE */);
  builder.push("\x1B[H" /* MOVE_CURSOR_HOME */);
  stdout.write(builder.join(""));
  stdin.setEncoding("utf-8");
  stdin.setRawMode(true);
  render(branchState);
}
try {
  main();
} catch (e) {
  printErrorAndSetExitCode(e);
}
