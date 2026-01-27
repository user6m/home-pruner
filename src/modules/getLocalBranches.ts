import { execFileSync } from "node:child_process";
import { CliError } from "../errors/cli-error";
import type { Branch } from "../type/branch";
import { buildLocalBranches } from "./buildLocalBranches";

export function getLocalBranches(): Branch[] {
  const isGitRepo = (() => {
    try {
      execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
        stdio: "ignore",
      });

      return true;
    } catch {
      return false;
    }
  })();
  if (!isGitRepo) {
    throw new CliError({
      code: "NOT_GIT_REPO",
      userMessage: "You are not in the git repo.",
    });
  }

  const currentBranchName = (() => {
    try {
      const result = execFileSync("git", ["branch", "--show-current"]);
      const formatted = result.toString().trim();

      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get current branch name.",
        cause: e,
      });
    }
  })();

  const localBranchNames = (() => {
    try {
      const result = execFileSync("git", [
        "branch",
        "--format=%(refname:short)",
      ]);
      const formatted = result.toString().split("\n").filter(Boolean);

      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get local branches.",
        cause: e,
      });
    }
  })();

  const branchList: Branch[] = buildLocalBranches(
    currentBranchName ?? "",
    localBranchNames ?? [],
  );

  return branchList;
}
