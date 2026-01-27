import type { Branch } from "../type/branch";

export function createBranch(name: string, CurrntBranchName: string): Branch {
  const isCurrent = name === CurrntBranchName;
  const branch: Branch = {
    name,
    isCurrent,
    isSelectable: !isCurrent,
    isSelected: false,
  };

  return branch;
}
