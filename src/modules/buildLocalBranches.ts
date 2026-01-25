import type { Branch } from "../type/branch";
import { createBranch } from "./createBranch";

export function buildLocalBranches(
  currentBranchName: string,
  localBranchNames: string[],
) {
  const formatted: Branch[] = localBranchNames
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((name) => createBranch(name, currentBranchName));
  return formatted;
}
