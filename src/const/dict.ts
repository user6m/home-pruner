import { green, reverse } from "../modules/colorWrapper";

export const dict = {
  banner: `${green("=================")}\n${green("|| home-pruner ||")}\n${green("=================")}\n`,
  currentGitRepo: (name: string) =>
    `*Current git repository : ${green(name)}\n`,
  currentBranchNum: (num: string) =>
    `*Local branches count   : ${green(num)}\n`,
  deletionPending: "[Pending] Press Enter to delete(or f to force delete)",
  keyGuide: `\n${reverse("^C")} Quit  ${reverse("Enter")} Toggle/Delete  ${reverse("f")} Force Delete  ${reverse("t")} Toggle Banner`,
  deletedBranch: (name: string) => `Deleted branch: ${name}`,
  failedToDelete: (detail: string) => `Failed to delete branch. ${detail}`,
  failedToForceDelete: (detail: string) =>
    `Failed to force delete branch. ${detail}`,
};
