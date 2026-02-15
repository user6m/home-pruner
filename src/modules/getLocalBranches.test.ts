import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLocalBranches } from "./getLocalBranches";
import { execFileSync } from "node:child_process";
import { postprocess } from "./postprocess";
import { buildLocalBranches } from "./buildLocalBranches";
import { CliError } from "../errors/cli-error";

vi.mock("node:child_process");
vi.mock("./postprocess");
vi.mock("./buildLocalBranches");

describe("getLocalBranches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return branches correctly in a git repository", () => {
    // Arrange
    vi.mocked(execFileSync).mockImplementation((cmd, args) => {
      if (cmd !== "git") throw new Error("Unexpected command");
      if (args?.includes("--is-inside-work-tree")) return Buffer.from("true");
      if (args?.includes("--show-current")) return Buffer.from("main\n");
      if (args?.includes("--format=%(refname:short)"))
        return Buffer.from("main\nfeature/1\nfeature/2\n");
      return Buffer.from("");
    });

    const mockBranches = [
      { name: "main", isSelected: false, isSelectable: false, isCurrent: true },
      {
        name: "feature/1",
        isSelected: false,
        isSelectable: true,
        isCurrent: false,
      },
      {
        name: "feature/2",
        isSelected: false,
        isSelectable: true,
        isCurrent: false,
      },
    ];
    vi.mocked(buildLocalBranches).mockReturnValue(mockBranches);

    // Act
    const result = getLocalBranches();

    // Assert
    expect(result).toEqual(mockBranches);
    expect(buildLocalBranches).toHaveBeenCalledWith("main", [
      "main",
      "feature/1",
      "feature/2",
    ]);
    expect(postprocess).not.toHaveBeenCalled();
  });

  it("should throw NOT_GIT_REPO error if not in a git repository", () => {
    // Arrange
    vi.mocked(execFileSync).mockImplementation((cmd, args) => {
      if (args?.includes("--is-inside-work-tree"))
        throw new Error("fatal: not a git repository");
      return Buffer.from("");
    });

    // Act & Assert
    expect(() => getLocalBranches()).toThrow(CliError);
    try {
      getLocalBranches();
    } catch (e) {
      const error = e as CliError;
      expect(error.code).toBe("NOT_GIT_REPO");
    }
    expect(postprocess).toHaveBeenCalled();
  });

  it("should throw GIT_COMMAND_FAILED if getting current branch fails", () => {
    // Arrange
    vi.mocked(execFileSync).mockImplementation((cmd, args) => {
      if (args?.includes("--is-inside-work-tree")) return Buffer.from("true");
      if (args?.includes("--show-current")) throw new Error("git error");
      return Buffer.from("");
    });

    // Act & Assert
    expect(() => getLocalBranches()).toThrow(CliError);
    try {
      getLocalBranches();
    } catch (e) {
      const error = e as CliError;
      expect(error.code).toBe("GIT_COMMAND_FAILED");
      expect(error.message).toContain("Cannnot get current branch name");
    }
    expect(postprocess).toHaveBeenCalled();
  });

  it("should throw GIT_COMMAND_FAILED if getting local branches fails", () => {
    // Arrange
    vi.mocked(execFileSync).mockImplementation((cmd, args) => {
      if (args?.includes("--is-inside-work-tree")) return Buffer.from("true");
      if (args?.includes("--show-current")) return Buffer.from("main");
      if (args?.includes("--format=%(refname:short)"))
        throw new Error("git error");
      return Buffer.from("");
    });

    // Act & Assert
    expect(() => getLocalBranches()).toThrow(CliError);
    try {
      getLocalBranches();
    } catch (e) {
      const error = e as CliError;
      expect(error.code).toBe("GIT_COMMAND_FAILED");
      expect(error.message).toContain("Cannnot get local branches");
    }
    expect(postprocess).toHaveBeenCalled();
  });
});
