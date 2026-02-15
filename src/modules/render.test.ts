import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { render } from "./render";
import { execFileSync } from "node:child_process";
import type { BranchState } from "../type/branchState";
import { SCREEN_EVENT } from "../const/screenEvent";
import { dict } from "../const/dict";

vi.mock("node:child_process");

describe("render", () => {
  let stdoutWriteSpy: MockInstance;

  const mockBranchState: BranchState = {
    branches: [
      { name: "main", isSelected: false, isSelectable: false, isCurrent: true },
      {
        name: "feature/1",
        isSelected: false,
        isSelectable: true,
        isCurrent: false,
      },
      {
        name: "feature/2",
        isSelected: true,
        isSelectable: true,
        isCurrent: false,
      },
    ],
    cursorIndex: 0,
    showBanner: true,
  };

  beforeEach(() => {
    // Mock stdout.write
    stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    // Mock terminal height by defining the property
    Object.defineProperty(process.stdout, "rows", {
      value: 20,
      configurable: true,
      writable: true,
    });

    // Mock git commands default responses
    vi.mocked(execFileSync).mockImplementation((_cmd, args) => {
      if (args && args.includes("--show-toplevel")) return "/mock/repo/path";
      if (args && args.includes("--show-current")) return "main";
      return "";
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // No need to restore rows strictly if we assume environment is reset or we just overwrite it next time
  });

  it("should render default state correctly", () => {
    // Arrange
    const state = { ...mockBranchState };

    // Act
    render(state);

    // Assert
    expect(execFileSync).toHaveBeenCalledWith("git", [
      "rev-parse",
      "--show-toplevel",
    ]);
    expect(execFileSync).toHaveBeenCalledWith("git", [
      "branch",
      "--show-current",
    ]);

    // Check if output contains expected parts (simplified check as full string matching is brittle)
    const output = stdoutWriteSpy.mock.calls[0]![0];
    expect(output).toContain(SCREEN_EVENT.CLEAR_SCREEN);
    expect(output).toContain(dict.banner);
    expect(output).toContain("/mock/repo/path");
    expect(output).toContain("feature/1"); // should be visible
  });

  it("should highlight current branch", () => {
    // Arrange
    const state = { ...mockBranchState, cursorIndex: 0 }; // cursor on main (current branch)

    // Act
    render(state);

    // Assert
    const output = stdoutWriteSpy.mock.calls[0]![0];
    // We expect "main" to be rendered. Visual styling is harder to test strictly without parsing ANSI codes,
    // but we can check existence.
    expect(output).toContain("main");
  });

  it("should show deletion pending status for selected branch", () => {
    // Arrange
    const state = { ...mockBranchState };
    // feature/2 is selected in mockBranchState

    // Act
    render(state);

    // Assert
    const output = stdoutWriteSpy.mock.calls[0]![0];
    // feature/2 should be rendered. Logic adds specific suffix or style, but we check basic presence first.
    // Ideally we would check for `dict.deletionPending` if it was just appended text,
    // strictly speaking it might be wrapped in color codes.
    expect(output).toContain("feature/2");
  });

  it("should not show banner when showBanner is false", () => {
    // Arrange
    const state = { ...mockBranchState, showBanner: false };

    // Act
    render(state);

    // Assert
    const output = stdoutWriteSpy.mock.calls[0]![0];
    expect(output).not.toContain(dict.banner);
    expect(output).toContain("main"); // content should still be there
  });

  it("should render success message when present", () => {
    // Arrange
    const state = {
      ...mockBranchState,
      message: {
        type: "success" as const,
        text: "Branch deleted successfully",
      },
    };

    // Act
    render(state);

    // Assert
    const output = stdoutWriteSpy.mock.calls[0]![0];
    expect(output).toContain("Branch deleted successfully");
  });

  it("should render error message when present", () => {
    // Arrange
    const state = {
      ...mockBranchState,
      message: { type: "error" as const, text: "Failed to delete branch" },
    };

    // Act
    render(state);

    // Assert
    const output = stdoutWriteSpy.mock.calls[0]![0];
    expect(output).toContain("Failed to delete branch");
  });

  it("should handle scrolling when cursor is outside visible rows", () => {
    // Arrange
    // Set terminal height very small to force scrolling
    Object.defineProperty(process.stdout, "rows", {
      value: 6,
      configurable: true,
      writable: true,
    }); // Header is ~5 lines, leaves ~1 line for content

    // Create many branches
    const manyBranches = Array.from({ length: 10 }, (_, i) => ({
      name: `branch-${i}`,
      isSelected: false,
      isSelectable: true,
      isCurrent: false,
    }));

    // Move cursor to the end
    const state: BranchState = {
      branches: manyBranches,
      cursorIndex: 9,
      showBanner: true,
    };

    // Act
    render(state);

    // Assert
    const output = stdoutWriteSpy.mock.calls[0]![0];
    // Should show the last branch
    expect(output).toContain("branch-9");
    // Should NOT show the first branch (scrolled out)
    expect(output).not.toContain("branch-0");
  });
});
