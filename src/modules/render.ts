import { execFileSync } from "child_process";
import type { BranchState } from "../main";
import { SCREEN_EVENT } from "../const/screenEvent";
import { CliError } from "../errors/cli-error";
import { green, reverse } from "./colorWrapper";

const dict = {
  banner: `
=================
|| home-pruner ||
=================
`,
  currentGitRepo: (name: string) =>
    `*Current git repository : ${green(name)}\n`,
  currentBranchNum: (num: string) =>
    `*Local branches count   : ${green(num)}\n`,
};

export function render(branchState: BranchState) {
  const focused = branchState.branches[branchState.cursorIndex];
  const stdout = process.stdout;
  const terminalHeight = stdout.rows;
  const headerHeight = 5;
  const visibleRows = terminalHeight - headerHeight;
  const focusedIndex = branchState.cursorIndex;
  const currentGitRepoName = (() => {
    try {
      const result = execFileSync("git", ["rev-parse", "--show-toplevel"]);
      const formatted = result.toString().trim();

      return formatted;
    } catch (e) {
      throw new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "Cannnot get git repo name",
        cause: e,
      });
    }
  })();
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

  let startIndex = 0;
  if (focusedIndex >= visibleRows) {
    startIndex = focusedIndex - visibleRows + 1;
  }

  // create texts
  const builder = [];

  // reset screen
  builder.push(SCREEN_EVENT.CLEAR_SCREEN);
  builder.push(SCREEN_EVENT.MOVE_CURSOR_HOME);

  // banner
  builder.push(dict.banner);
  builder.push(dict.currentGitRepo(currentGitRepoName));
  builder.push(
    dict.currentBranchNum((branchState.branches.length ?? 0).toString()),
  );

  // content
  builder.push(
    branchState.branches
      .slice(startIndex, startIndex + visibleRows)
      .map((b) => {
        const name = b.name;
        const suffix = name === currentBranchName ? "(current)" : "";
        const context = name + " " + suffix;
        if (name === focused?.name) return reverse(context);
        if (name === currentBranchName) return green(context);
        return name;
      })
      .join(`\n`),
  );

  // output texts
  stdout.write(builder.join(""));
}
