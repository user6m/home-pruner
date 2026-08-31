/**
 * Sets up a disposable git repository under the OS temp dir and runs
 * home-pruner against it, so branch deletion can be tried out without
 * touching a real repository.
 *
 * The fixture repo contains these branches:
 * - `main` (current branch)
 * - `feature/awesome-feature` — merged, deletable with a normal delete
 * - `bugfix/login-issue` — merged, deletable with a normal delete
 * - `feature/wip-refactor` — unmerged, requires force delete
 * - `release/v1.2.0` — unmerged, requires force delete
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mockRepoDir = join(tmpdir(), "home-pruner-mock-repo");

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

	// merged branches: no extra commits, so `git branch -d` succeeds
	git(["branch", "feature/awesome-feature"]);
	git(["branch", "bugfix/login-issue"]);

	// unmerged branches: extra commit not reachable from main, so `git branch -d` fails
	// and force delete (`f` in home-pruner) is required
	git(["checkout", "-b", "feature/wip-refactor"]);
	git(["commit", "--allow-empty", "-m", "wip: refactor in progress"]);
	git(["checkout", "-b", "release/v1.2.0", "main"]);
	git(["commit", "--allow-empty", "-m", "chore: release prep"]);

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
