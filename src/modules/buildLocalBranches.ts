import { makeBranch, type Branch } from "../domain/branch";

export function buildLocalBranches(
  currentBranchName: string,
  localBranchNames: string[],
) {
  const formatted: Branch[] = localBranchNames
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((name) => makeBranch(name, currentBranchName));
  return formatted;
}
