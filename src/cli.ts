import { buildLocalBranches } from "./modules/buildLocalBranches";
import { execFileSync } from "node:child_process";
import { printErrorAndSetExitCode } from "./modules/printErrorAndSetExitCode";
import { CliError } from "./errors/cli-error";
import type { Branch } from "./type/branch";
import { KEY_EVENT } from "./const/keyEvent";
import type { MOUSE_EVENT } from "./const/mouseEvent";

type UIState = {
  branches: Branch[];
  cursorIndex: number;
};

type UIAction = {
  type: "UP" | "DOWN" | "TOGGLE";
};

function main() {
  const {
    currentBranchName: _currentBranchName,
    localBranchNames: _localBranchNames,
    branchList,
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

      const nextBranches = branches.map((b, i) =>
        i === cursorIndex ? { ...b, isSelected: !b.isSelected } : b,
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
