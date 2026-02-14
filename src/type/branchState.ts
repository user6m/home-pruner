import type { Branch } from "./branch";

export type BranchState = {
  branches: Branch[];
  cursorIndex: number;
  message?:
    | {
        type: "success" | "error";
        text: string;
      }
    | undefined;
  showBanner: boolean;
};
