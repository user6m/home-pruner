import { printErrorAndSetExitCode } from "./modules/printErrorAndSetExitCode";
import type { Branch } from "./type/branch";
import { SCREEN_EVENT } from "./const/screenEvent";
import { KEY_EVENT } from "./const/keyEvent";
import { getLocalBranches } from "./modules/getLocalBranches";
import { actionReducer } from "./modules/actionReducer";
import { render } from "./modules/render";

export type BranchState = {
  branches: Branch[];
  cursorIndex: number;
};

export type Action = { type: "UP" } | { type: "DOWN" } | { type: "TOGGLE" };

function main() {
  const stdin = process.stdin;
  const branches: Branch[] = getLocalBranches();
  let bracnchState: BranchState = {
    branches,
    cursorIndex: 0,
  };
  const onData = (key: Buffer | string) => {
    const input = typeof key === "string" ? key : key.toString("utf-8");

    // end session
    if (input === KEY_EVENT.CTRL_C || input === "q") {
      stdin.off("data", onData);
      postprocess();
      return;
    }

    const resetSelection = () => {
      bracnchState.branches = bracnchState.branches.map((b) => {
        return { ...b, isSelected: false };
      });
    };

    let action: Action | null = null;
    action = (() => {
      switch (input) {
        case KEY_EVENT.ARROW_UP:
        case "i":
          resetSelection();
          return { type: "UP" };
        case KEY_EVENT.ARROW_DOWN:
        case "k":
          resetSelection();
          return { type: "DOWN" };
        case KEY_EVENT.ENTER:
        case " ":
          return { type: "TOGGLE" };
        default:
          return null;
      }
    })();

    if (!action) return;

    bracnchState = actionReducer(bracnchState, action);
    render(bracnchState); // perform render after each action
  };

  // start session
  preprocess(bracnchState);
  stdin.on("data", onData);
}

function preprocess(branchState: BranchState) {
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

export function postprocess() {
  const stdout = process.stdout;
  const stdin = process.stdin;
  const builder = [];

  builder.push(SCREEN_EVENT.EXIT_ALT_SCREEN);
  builder.push(SCREEN_EVENT.SHOW_PIPE);
  stdout.write(builder.join(""));

  if (stdin.isRaw) stdin.setRawMode(false);
  stdin.pause();
}

try {
  main();
} catch (e) {
  printErrorAndSetExitCode(e);
}
