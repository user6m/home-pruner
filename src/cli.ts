import { buildLocalBranches } from "./modules/buildLocalBranches";
import { execFileSync } from "node:child_process";
import { printErrorAndSetExitCode } from "./modules/printErrorAndSetExitCode";
import { CliError } from "./errors/cli-error";
import type { Branch } from "./type/branch";
import { SCREEN_EVENT } from "./const/screenEvent";
import { KEY_EVENT } from "./const/keyEvent";

type UIState = {
  branches: Branch[];
  cursorIndex: number;
};

type UIAction =
  | { type: "UP" }
  | { type: "DOWN" }
  | { type: "TOGGLE" }
  | { type: "QUIT" }
  | { type: "INVALID" };

function main() {
  const { branchList } = prepareBranches();
  let state = initializeState(branchList);

  const { stdin } = prepareStdInOut();
  printState(state);

  const onData = (key: Buffer | string) => {
    const s = typeof key === "string" ? key : key.toString("utf-8");

    if (s === KEY_EVENT.CTRL_C || s === "q") {
      stdin.off("data", onData);
      cleanup();
      return;
    }

    let action: UIAction | null = null;
    action = (() => {
      switch (s) {
        case KEY_EVENT.ARROW_UP:
        case "i":
          return { type: "UP" };
        case KEY_EVENT.ARROW_DOWN:
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
    printState(state);
  };

  stdin.on("data", onData);
}

function prepareBranches() {
  const isGitRepo = (() => {
    try {
      execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
        stdio: "ignore",
      });

      return true;
    } catch {
      return false;
    }
  })();
  if (!isGitRepo) {
    throw new CliError({
      code: "NOT_GIT_REPO",
      userMessage: "You are not in the git repo.",
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
        cause: e,
      });
    }
  })();

  const localBranchNames = (() => {
    try {
      const result = execFileSync("git", [
        "branch",
        "--format=%(refname:short)",
      ]);
      const formatted = result.toString().split("\n").filter(Boolean);

      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get local branches.",
        cause: e,
      });
    }
  })();

  const branchList: Branch[] = buildLocalBranches(
    currentBranchName ?? "",
    localBranchNames ?? [],
  );

  return {
    currentBranchName,
    localBranchNames,
    branchList,
  };
}

function initializeState(branches: Branch[]): UIState {
  return {
    branches,
    cursorIndex: 0,
  };
}

function getSelectedBranchNames(state: UIState): string[] {
  return state.branches.filter((b) => b.isSelected).map((b) => b.name);
}

function actionReducer(state: UIState, action: UIAction) {
  const { branches, cursorIndex } = state;

  switch (action.type) {
    case "UP": {
      const newIndex = Math.max(0, cursorIndex - 1);
      return newIndex === cursorIndex
        ? state
        : { ...state, cursorIndex: newIndex };
    }

    case "DOWN": {
      const lastIndex = Math.max(0, branches.length - 1);
      const newIndex = Math.min(lastIndex, cursorIndex + 1);
      return newIndex === cursorIndex
        ? state
        : { ...state, cursorIndex: newIndex };
    }

    case "TOGGLE": {
      const current = branches[cursorIndex];
      if (!current) return state;

      if (!current.isSelectable) return state;

      const nextBranches = branches.map((b, i) =>
        i === cursorIndex ? { ...b, isSelected: !b.isSelected } : b,
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

function printState(state: UIState) {
  const focused = state.branches[state.cursorIndex];
  const selected = getSelectedBranchNames(state);

  console.log({
    cursorIndex: state.cursorIndex,
    focused: focused
      ? {
          name: focused.name,
          isSelectable: focused.isSelectable,
          isSelected: focused.isSelected,
          isCurrent: focused.isCurrent,
        }
      : null,
    selected,
  });
}

function prepareStdInOut() {
  const stdin = process.stdin;
  const stdout = process.stdout;

  stdout.write(SCREEN_EVENT.ENTER_ALT_SCREEN);
  stdout.write(SCREEN_EVENT.HIDE_PIPE);

  stdin.setEncoding("utf-8");
  stdin.setRawMode(true);

  return {
    stdin,
    stdout,
  };
}

function cleanup() {
  const stdout = process.stdout;
  const stdin = process.stdin;

  try {
    stdout.write(SCREEN_EVENT.EXIT_ALT_SCREEN);
    stdout.write(SCREEN_EVENT.SHOW_PIPE);
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
