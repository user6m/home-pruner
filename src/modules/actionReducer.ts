import type { Action, BranchState } from "../main";

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
