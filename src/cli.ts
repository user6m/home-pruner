import { type Branch } from "./domain/branch";
import { buildLocalBranches } from "./modules/buildLocalBranches";
import { execFileSync } from "node:child_process";
import { printErrorAndSetExitCode } from "./modules/printErrorAndSetExitCode";
import { CliError } from "./errors/cli-error";

function main() {
  // check current repo is controlled by git
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

  console.log("Local Branches:", branchList);
}

try {
  main();
} catch (e) {
  printErrorAndSetExitCode(e);
}
