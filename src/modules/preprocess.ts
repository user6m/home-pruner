import type { BranchState } from "../type/branchState";
import { SCREEN_EVENT } from "../const/screenEvent";
import { render } from "./render";

export function preprocess(branchState: BranchState) {
  const stdin = process.stdin;
  const stdout = process.stdout;
  const builder = [];

  builder.push(SCREEN_EVENT.ENTER_ALT_SCREEN);
  builder.push(SCREEN_EVENT.HIDE_PIPE);
  builder.push(SCREEN_EVENT.MOVE_CURSOR_HOME);
  stdout.write(builder.join(""));

  stdin.setEncoding("utf-8");
  stdin.setRawMode(true);

  // perform initial render
  render(branchState);
}
