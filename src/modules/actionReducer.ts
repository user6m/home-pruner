import { dict } from "../const/dict";
import { saveConfig } from "./config";
import { execFileSync } from "node:child_process";
import { getLocalBranches } from "./getLocalBranches";
import type { Action } from "../main";
import type { BranchState } from "../type/branchState";

interface ExecError extends Error {
  stderr: Buffer;
}

export function actionReducer(state: BranchState, action: Action): BranchState {
  const { branches, cursorIndex } = state;
  switch (action.type) {
    case "UP": {
      const newIndex = Math.max(0, cursorIndex - 1);
      return newIndex === cursorIndex
        ? { ...state, message: undefined }
        : { ...state, cursorIndex: newIndex, message: undefined };
    }
    case "DOWN": {
      const lastIndex = Math.max(0, branches.length - 1);
      const newIndex = Math.min(lastIndex, cursorIndex + 1);
      return newIndex === cursorIndex
        ? { ...state, message: undefined }
        : { ...state, cursorIndex: newIndex, message: undefined };
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
            message: {
              type: "success",
              text: dict.deletedBranch(targetBranch.name),
            },
          };
        } catch (e) {
          const detail =
            e instanceof Error && "stderr" in e
              ? (e as ExecError).stderr.toString().trim()
              : e instanceof Error
                ? e.message
                : String(e);
          const nextBranches = branches.map((b, i) =>
            i === cursorIndex ? { ...b, isSelected: false } : b,
          );
          return {
            ...state,
            branches: nextBranches,
            message: {
              type: "error",
              text: dict.failedToDelete(detail),
            },
          };
        }
      }

      const nextBranches = branches.map((b, i) =>
        i === cursorIndex ? { ...b, isSelected: !b.isSelected } : b,
      );
      return { ...state, branches: nextBranches, message: undefined };
    }
    case "FORCE_DELETE": {
      const targetBranch = branches[cursorIndex];
      if (!targetBranch || !targetBranch.isSelected) return state;

      try {
        execFileSync("git", ["branch", "-D", `${targetBranch.name}`], {
          stdio: "pipe",
        });

        const localBranches = getLocalBranches();
        const newCursorIndex =
          localBranches.length === 0
            ? 0
            : Math.min(cursorIndex, localBranches.length - 1);
        return {
          ...state,
          branches: localBranches,
          cursorIndex: newCursorIndex,
          message: {
            type: "success",
            text: dict.deletedBranch(targetBranch.name),
          },
        };
      } catch (e) {
        const detail =
          e instanceof Error && "stderr" in e
            ? (e as ExecError).stderr.toString().trim()
            : e instanceof Error
              ? e.message
              : String(e);
        return {
          ...state,
          message: {
            type: "error",
            text: dict.failedToForceDelete(detail),
          },
        };
      }
    }
    case "TOGGLE_BANNER": {
      const showBanner = !state.showBanner;
      saveConfig({ showBanner });
      return { ...state, showBanner };
    }
  }

  return state;
}
