import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { printErrorAndSetExitCode } from "./modules/printErrorAndSetExitCode";
import type { Branch } from "./type/branch";
import { KEY_EVENT } from "./const/keyEvent";
import { getLocalBranches } from "./modules/getLocalBranches";
import { actionReducer } from "./modules/actionReducer";
import { render } from "./modules/render";
import { postprocess } from "./modules/postprocess";
import { loadConfig } from "./modules/config";
import type { BranchState } from "./type/branchState";
import { preprocess } from "./modules/preprocess";

export type Action =
  | { type: "UP" }
  | { type: "DOWN" }
  | { type: "TOGGLE" }
  | { type: "FORCE_DELETE" }
  | { type: "TOGGLE_BANNER" };

export function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
 Usage: home-pruner [options]

 Options:
   --help, -h     Show this help message
   --version, -v  Show version
 `);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const packageJsonPath = join(__dirname, "../package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      console.log(`v${packageJson.version}`);
    } catch {
      console.log("Unknown version");
    }
    process.exit(0);
  }

  // Check if .git exists
  if (!existsSync(join(process.cwd(), ".git"))) {
    console.error(
      "Error: This is not a git repository (no .git directory found).",
    );
    process.exit(1);
  }

  const stdin = process.stdin;
  const branches: Branch[] = getLocalBranches();
  const config = loadConfig();
  let branchState: BranchState = {
    branches,
    cursorIndex: 0,
    showBanner: config.showBanner,
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
      branchState.branches = branchState.branches.map((b) => {
        return { ...b, isSelected: false };
      });
    };

    const action: Action | null = (() => {
      const trimmed = input.trim();

      // robust check for letter commands
      if (trimmed === "i") {
        resetSelection();
        return { type: "UP" };
      }
      if (trimmed === "k") {
        resetSelection();
        return { type: "DOWN" };
      }
      if (trimmed === "f") return { type: "FORCE_DELETE" };
      if (trimmed === "t") return { type: "TOGGLE_BANNER" };

      // exact check for control keys
      switch (input) {
        case KEY_EVENT.ARROW_UP:
          resetSelection();
          return { type: "UP" };
        case KEY_EVENT.ARROW_DOWN:
          resetSelection();
          return { type: "DOWN" };
        case KEY_EVENT.ENTER:
          return { type: "TOGGLE" };
        default:
          resetSelection();
          return null;
      }
    })();

    if (!action) return;

    branchState = actionReducer(branchState, action);
    render(branchState); // perform render after each action
  };

  // start session
  preprocess(branchState);
  stdin.on("data", onData);
}

if (process.env["NODE_ENV"] !== "test") {
  try {
    main();
  } catch (e) {
    printErrorAndSetExitCode(e);
  }
}
