import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type PackageInfo = {
	name: string;
	version: string;
};

export function getPackageInfo(): PackageInfo | null {
	try {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const packageJsonPath = join(__dirname, "../package.json");
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
		return { name: packageJson.name, version: packageJson.version };
	} catch {
		return null;
	}
}
