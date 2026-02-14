import type { Branch } from "./branch";

export type BranchState = {
  branches: Branch[];
  cursorIndex: number;
};
