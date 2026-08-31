import * as fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkForUpdate } from "./checkForUpdate";

vi.mock("fs");
vi.mock("os", () => ({
	homedir: vi.fn(() => "/mock/home"),
}));

const MOCK_CACHE_PATH = path.join(
	"/mock/home",
	".home-pruner-update-check.json",
);

const PACKAGE_INFO = { name: "@user6m/home-pruner", version: "1.0.0" };

describe("checkForUpdate", () => {
	let readFileSyncSpy: ReturnType<typeof vi.spyOn>;
	let writeFileSyncSpy: ReturnType<typeof vi.spyOn>;
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		readFileSyncSpy = vi.mocked(fs.readFileSync);
		writeFileSyncSpy = vi.mocked(fs.writeFileSync);
		fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("should return the latest version when a newer release exists", async () => {
		// Arrange
		readFileSyncSpy.mockImplementation(() => {
			throw new Error("no cache");
		});
		fetchSpy.mockResolvedValue({
			ok: true,
			json: async () => ({ version: "2.0.0" }),
		});

		// Act
		const result = await checkForUpdate(PACKAGE_INFO);

		// Assert
		expect(result).toBe("2.0.0");
		expect(fetchSpy).toHaveBeenCalledWith(
			"https://registry.npmjs.org/@user6m%2Fhome-pruner/latest",
			expect.objectContaining({ signal: expect.anything() }),
		);
		expect(writeFileSyncSpy).toHaveBeenCalledWith(
			MOCK_CACHE_PATH,
			expect.stringContaining("2.0.0"),
		);
	});

	it("should return null when already up to date", async () => {
		// Arrange
		readFileSyncSpy.mockImplementation(() => {
			throw new Error("no cache");
		});
		fetchSpy.mockResolvedValue({
			ok: true,
			json: async () => ({ version: "1.0.0" }),
		});

		// Act
		const result = await checkForUpdate(PACKAGE_INFO);

		// Assert
		expect(result).toBeNull();
	});

	it("should use the cached result without calling fetch when cache is fresh", async () => {
		// Arrange
		readFileSyncSpy.mockReturnValue(
			JSON.stringify({ checkedAt: Date.now(), latestVersion: "3.0.0" }),
		);

		// Act
		const result = await checkForUpdate(PACKAGE_INFO);

		// Assert
		expect(result).toBe("3.0.0");
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("should refetch when cache is stale", async () => {
		// Arrange
		readFileSyncSpy.mockReturnValue(
			JSON.stringify({
				checkedAt: Date.now() - 25 * 60 * 60 * 1000,
				latestVersion: "1.5.0",
			}),
		);
		fetchSpy.mockResolvedValue({
			ok: true,
			json: async () => ({ version: "2.0.0" }),
		});

		// Act
		const result = await checkForUpdate(PACKAGE_INFO);

		// Assert
		expect(result).toBe("2.0.0");
		expect(fetchSpy).toHaveBeenCalled();
	});

	it("should return null without throwing when the request fails", async () => {
		// Arrange
		readFileSyncSpy.mockImplementation(() => {
			throw new Error("no cache");
		});
		fetchSpy.mockRejectedValue(new Error("network error"));

		// Act
		const result = await checkForUpdate(PACKAGE_INFO);

		// Assert
		expect(result).toBeNull();
	});

	it("should return null when the response is not ok", async () => {
		// Arrange
		readFileSyncSpy.mockImplementation(() => {
			throw new Error("no cache");
		});
		fetchSpy.mockResolvedValue({ ok: false, json: async () => ({}) });

		// Act
		const result = await checkForUpdate(PACKAGE_INFO);

		// Assert
		expect(result).toBeNull();
	});
});
