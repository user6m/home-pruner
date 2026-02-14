import { green } from "../modules/colorWrapper";

export const dict = {
  banner: `=================
|| home-pruner ||
=================
`,
  currentGitRepo: (name: string) =>
    `*Current git repository : ${green(name)}\n`,
  currentBranchNum: (num: string) =>
    `*Local branches count   : ${green(num)}\n`,
  instruction: "[!!] Press [Enter] to delete, [f] to force delete",
  deletedBranch: (name: string) => `Deleted branch: ${name}`,
  failedToDelete: (detail: string) => `Failed to delete branch. ${detail}`,
  failedToForceDelete: (detail: string) =>
    `Failed to force delete branch. ${detail}`,
};
