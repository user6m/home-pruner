import * as fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPackageInfo } from "./getPackageInfo";

vi.mock("node:fs");
vi.mock("node:path", () => ({
	join: (...args: string[]) => args.join("/"),
	dirname: (path: string) => path.split("/").slice(0, -1).join("/"),
}));

describe("getPackageInfo", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return the package name and version", () => {
		// Arrange
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({ name: "@user6m/home-pruner", version: "1.0.0" }),
		);

		// Act
		const info = getPackageInfo();

		// Assert
		expect(info).toEqual({ name: "@user6m/home-pruner", version: "1.0.0" });
	});

	it("should return null when package.json cannot be read", () => {
		// Arrange
		vi.mocked(fs.readFileSync).mockImplementation(() => {
			throw new Error("File not found");
		});

		// Act
		const info = getPackageInfo();

		// Assert
		expect(info).toBeNull();
	});

	it("should return null when package.json contains invalid JSON", () => {
		// Arrange
		vi.mocked(fs.readFileSync).mockReturnValue("invalid json");

		// Act
		const info = getPackageInfo();

		// Assert
		expect(info).toBeNull();
	});
});
