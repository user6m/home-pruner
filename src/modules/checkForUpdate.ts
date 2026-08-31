import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PackageInfo } from "./getPackageInfo";

type UpdateCache = {
	checkedAt: number;
	latestVersion: string;
};

const CACHE_FILE_PATH = join(homedir(), ".home-pruner-update-check.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 3000;

function readCache(): UpdateCache | null {
	try {
		const data = readFileSync(CACHE_FILE_PATH, "utf-8");
		return JSON.parse(data);
	} catch {
		return null;
	}
}

function writeCache(cache: UpdateCache) {
	try {
		writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
	} catch {
		// ignore error
	}
}

// Compares only major.minor.patch; pre-release/build metadata is ignored.
function isNewerVersion(current: string, candidate: string): boolean {
	const parse = (v: string) =>
		v
			.replace(/^v/, "")
			.split("-")[0]
			?.split(".")
			.map((n) => Number.parseInt(n, 10) || 0) ?? [];

	const [c0 = 0, c1 = 0, c2 = 0] = parse(current);
	const [n0 = 0, n1 = 0, n2 = 0] = parse(candidate);

	if (n0 !== c0) return n0 > c0;
	if (n1 !== c1) return n1 > c1;
	return n2 > c2;
}

async function fetchLatestVersion(packageName: string): Promise<string | null> {
	// npm registry expects scoped package names as `@scope%2Fname`.
	const encodedName = packageName.includes("/")
		? packageName.replace("/", "%2F")
		: packageName;
	const url = `https://registry.npmjs.org/${encodedName}/latest`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) return null;
		const data = await response.json();
		return typeof data?.version === "string" ? data.version : null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

export async function checkForUpdate(
	packageInfo: PackageInfo,
): Promise<string | null> {
	const { name, version } = packageInfo;
	const cache = readCache();
	const now = Date.now();

	let latestVersion: string | null;

	if (cache && now - cache.checkedAt < CHECK_INTERVAL_MS) {
		latestVersion = cache.latestVersion;
	} else {
		latestVersion = await fetchLatestVersion(name);
		if (latestVersion) {
			writeCache({ checkedAt: now, latestVersion });
		}
	}

	if (latestVersion && isNewerVersion(version, latestVersion)) {
		return latestVersion;
	}
	return null;
}
