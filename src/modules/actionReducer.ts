import { execFileSync } from "node:child_process";
import { CliError } from "../errors/cli-error";
import { postprocess } from "../modules/postprocess";
import { getLocalBranches } from "./getLocalBranches";
import type { Action } from "../main";
import type { BranchState } from "../type/branchState";

export function actionReducer(state: BranchState, action: Action) {
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
      const targetBranch = branches[cursorIndex];
      if (!targetBranch) return state;
      if (!targetBranch.isSelectable) return state;

      // perform delete when selected
      if (targetBranch.isSelected) {
        try {
          execFileSync("git", ["branch", "-d", `${targetBranch.name}`], {
            stdio: "pipe",
          });

          // perform postprocess after delete
          const localBranches = getLocalBranches();
          const newCursorIndex =
            localBranches.length === 0
              ? 0
              : Math.min(cursorIndex, localBranches.length - 1);
          return {
            ...state,
            branches: localBranches,
            cursorIndex: newCursorIndex,
          };
        } catch (e) {
          postprocess();
          throw new CliError({
            code: "GIT_COMMAND_FAILED",
            userMessage: "Failed to delete a branch.",
            cause: e,
          });
        }
      }

      const nextBranches = branches.map((b, i) =>
        i === cursorIndex ? { ...b, isSelected: !b.isSelected } : b,
      );
      return { ...state, branches: nextBranches };
    }
  }
}
