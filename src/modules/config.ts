import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Config = {
	showBanner: boolean;
};

const CONFIG_FILE_PATH = join(homedir(), ".home-pruner.json");

const DEFAULT_CONFIG: Config = {
	showBanner: true,
};

export const loadConfig = (): Config => {
	try {
		const data = readFileSync(CONFIG_FILE_PATH, "utf-8");
		return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
	} catch {
		return DEFAULT_CONFIG;
	}
};

export const saveConfig = (config: Config) => {
	try {
		writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
	} catch {
		// ignore error
	}
};
