export type Branch = {
  name: string;
  isCurrent: boolean;
  isSelected: boolean;
  isSelectable: boolean;
};

export function makeBranch(name: string, CurrntBranchName: string): Branch {
  const isCurrent = name === CurrntBranchName;
  const branch: Branch = {
    name,
    isCurrent,
    isSelectable: !isCurrent,
    isSelected: false, // TODO: make logic later
  };

  return branch;
}
