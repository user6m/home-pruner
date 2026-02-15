import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { loadConfig, saveConfig } from "./config";
import fs from "fs";
import path from "path";

vi.mock("fs");
vi.mock("os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

describe("config", () => {
  let readFileSyncSpy: MockInstance;
  let writeFileSyncSpy: MockInstance;

  const MOCK_HOME_DIR = "/mock/home";
  const MOCK_CONFIG_PATH = path.join(MOCK_HOME_DIR, ".home-pruner.json");

  beforeEach(() => {
    // homedir mock is already set in vi.mock factory

    readFileSyncSpy = vi.mocked(fs.readFileSync);
    writeFileSyncSpy = vi.mocked(fs.writeFileSync);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadConfig", () => {
    it("should return default config if config file does not exist (read throws)", () => {
      // Arrange
      readFileSyncSpy.mockImplementation(() => {
        throw new Error("File not found");
      });

      // Act
      const config = loadConfig();

      // Assert
      expect(config).toEqual({ showBanner: true });
      expect(readFileSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH, "utf-8");
    });

    it("should return merged config if config file exists", () => {
      // Arrange
      const userConfig = { showBanner: false };
      readFileSyncSpy.mockReturnValue(JSON.stringify(userConfig));

      // Act
      const config = loadConfig();

      // Assert
      expect(config).toEqual({ showBanner: false });
    });

    it("should return default config if config file contains invalid JSON", () => {
      // Arrange
      readFileSyncSpy.mockReturnValue("invalid json");

      // Act
      const config = loadConfig();

      // Assert
      expect(config).toEqual({ showBanner: true });
    });
  });

  describe("saveConfig", () => {
    it("should save config to file", () => {
      // Arrange
      const config = { showBanner: false };

      // Act
      saveConfig(config);

      // Assert
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        MOCK_CONFIG_PATH,
        JSON.stringify(config, null, 2),
      );
    });

    it("should ignore errors during save", () => {
      // Arrange
      const config = { showBanner: false };
      writeFileSyncSpy.mockImplementation(() => {
        throw new Error("Write failed");
      });

      // Act
      // Should not throw
      saveConfig(config);

      // Assert
      expect(writeFileSyncSpy).toHaveBeenCalled();
    });
  });
});
