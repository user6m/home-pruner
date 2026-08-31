/**
 * Sets up a disposable git repository under the OS temp dir and runs
 * home-pruner against it, so branch deletion can be tried out without
 * touching a real repository.
 *
 * The fixture repo contains `main` (current branch) plus the branches
 * listed in FIXTURE_BRANCHES below: `merged` ones are deletable with a
 * normal delete, the rest carry an extra commit not on `main` and
 * require force delete (`f` in home-pruner).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mockRepoDir = join(tmpdir(), "home-pruner-mock-repo");

const FIXTURE_BRANCHES = [
	{ name: "feature/awesome-feature", merged: true },
	{ name: "feature/login-page", merged: true },
	{ name: "feature/dark-mode", merged: true },
	{ name: "feature/search-improvements", merged: false },
	{ name: "feature/wip-refactor", merged: false },
	{ name: "feature/notifications", merged: false },
	{ name: "bugfix/login-issue", merged: true },
	{ name: "bugfix/null-pointer", merged: true },
	{ name: "bugfix/memory-leak", merged: false },
	{ name: "bugfix/race-condition", merged: false },
	{ name: "hotfix/critical-crash", merged: true },
	{ name: "hotfix/security-patch", merged: false },
	{ name: "release/v1.0.0", merged: true },
	{ name: "release/v1.1.0", merged: true },
	{ name: "release/v1.2.0", merged: false },
	{ name: "chore/update-deps", merged: true },
	{ name: "chore/ci-config", merged: true },
	{ name: "docs/readme-update", merged: true },
	{ name: "docs/api-docs", merged: false },
	{ name: "experiment/old-idea", merged: false },
];

function git(args) {
	execFileSync("git", args, { cwd: mockRepoDir, stdio: "ignore" });
}

function setUpMockRepo() {
	// recreate from scratch on every run so the fixture state is always the same
	if (existsSync(mockRepoDir)) {
		rmSync(mockRepoDir, { recursive: true, force: true });
	}
	mkdirSync(mockRepoDir, { recursive: true });

	git(["init", "--initial-branch=main"]);
	git(["config", "user.email", "mock@home-pruner.local"]);
	git(["config", "user.name", "home-pruner mock"]);
	// --allow-empty: no files needed, we just need a commit to branch off of
	git(["commit", "--allow-empty", "-m", "chore: initial commit"]);

	for (const branch of FIXTURE_BRANCHES) {
		if (branch.merged) {
			// no extra commits, so `git branch -d` succeeds
			git(["branch", branch.name]);
			continue;
		}
		// extra commit not reachable from main, so `git branch -d` fails
		// and force delete is required
		git(["checkout", "-b", branch.name, "main"]);
		git(["commit", "--allow-empty", "-m", `wip: ${branch.name}`]);
	}

	git(["checkout", "main"]);
}

console.log(
	"Setting up a disposable git repository with fixture branches at:\n" +
		`  ${mockRepoDir}\n` +
		"home-pruner will run against this repo only — your real branches are untouched.\n",
);

setUpMockRepo();

// dist/main.js is expected to already be built (same assumption as the `start` script)
const distPath = join(__dirname, "../dist/main.js");
const result = spawnSync("node", [distPath], {
	cwd: mockRepoDir,
	stdio: "inherit",
});

// status is null if the process was killed by a signal (e.g. Ctrl+C)
process.exit(result.status ?? 0);
