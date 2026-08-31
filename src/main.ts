import { existsSync } from "node:fs";
import { join } from "node:path";
import { KEY_EVENT } from "./const/keyEvent";
import { actionReducer } from "./modules/actionReducer";
import { checkForUpdate } from "./modules/checkForUpdate";
import { loadConfig } from "./modules/config";
import { getLocalBranches } from "./modules/getLocalBranches";
import { getPackageInfo } from "./modules/getPackageInfo";
import { postprocess } from "./modules/postprocess";
import { preprocess } from "./modules/preprocess";
import { printErrorAndSetExitCode } from "./modules/printErrorAndSetExitCode";
import { render } from "./modules/render";
import type { Branch } from "./type/branch";
import type { BranchState } from "./type/branchState";

const ACTIONS = [
	"UP",
	"DOWN",
	"TOGGLE",
	"FORCE_DELETE",
	"TOGGLE_BANNER",
] as const;
export type Action = (typeof ACTIONS)[number];

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
		const packageInfo = getPackageInfo();
		console.log(packageInfo ? `v${packageInfo.version}` : "Unknown version");
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
	let sessionEnded = false;
	const onData = (key: Buffer | string) => {
		const input = typeof key === "string" ? key : key.toString("utf-8");

		// end session
		if (input === KEY_EVENT.CTRL_C || input === "q") {
			sessionEnded = true;
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
				return "UP";
			}
			if (trimmed === "k") {
				resetSelection();
				return "DOWN";
			}
			if (trimmed === "f") return "FORCE_DELETE";
			if (trimmed === "t") return "TOGGLE_BANNER";

			// exact check for control keys
			switch (input) {
				case KEY_EVENT.ARROW_UP:
					resetSelection();
					return "UP";
				case KEY_EVENT.ARROW_DOWN:
					resetSelection();
					return "DOWN";
				case KEY_EVENT.ENTER:
					return "TOGGLE";
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

	// check for a newer version in the background; never blocks startup
	if (config.checkForUpdates) {
		const packageInfo = getPackageInfo();
		if (packageInfo) {
			checkForUpdate(packageInfo)
				.then((latestVersion) => {
					if (!latestVersion || sessionEnded) return;
					branchState = {
						...branchState,
						updateAvailable: {
							current: packageInfo.version,
							latest: latestVersion,
						},
					};
					render(branchState);
				})
				.catch(() => {
					// ignore errors; update notification is best-effort
				});
		}
	}
}

if (process.env["NODE_ENV"] !== "test") {
	try {
		main();
	} catch (e) {
		printErrorAndSetExitCode(e);
	}
}
