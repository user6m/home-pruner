import { describe, it, expect, vi, beforeEach } from "vitest";
import { actionReducer } from "./actionReducer";
import type { BranchState } from "../type/branchState";
import { execFileSync } from "node:child_process";
import * as getLocalBranches from "./getLocalBranches";

vi.mock("node:child_process");
vi.mock("./getLocalBranches");

describe("actionReducer", () => {
  let initialState: BranchState;

  beforeEach(() => {
    initialState = {
      branches: [
        {
          name: "main",
          isSelected: false,
          isSelectable: false,
          isCurrent: true,
        },
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
      ],
      cursorIndex: 0,
      showBanner: true,
    };
    vi.clearAllMocks();
  });

  it("should move cursor down", () => {
    // Arrange
    // (initialState is set in beforeEach)

    // Act
    const newState = actionReducer(initialState, { type: "DOWN" });

    // Assert
    expect(newState.cursorIndex).toBe(1);
  });

  it("should not move cursor down beyond last branch", () => {
    // Arrange
    initialState.cursorIndex = 2;

    // Act
    const newState = actionReducer(initialState, { type: "DOWN" });

    // Assert
    expect(newState.cursorIndex).toBe(2);
  });

  it("should move cursor up", () => {
    // Arrange
    initialState.cursorIndex = 1;

    // Act
    const newState = actionReducer(initialState, { type: "UP" });

    // Assert
    expect(newState.cursorIndex).toBe(0);
  });

  it("should not move cursor up beyond first branch", () => {
    // Arrange
    initialState.cursorIndex = 0;

    // Act
    const newState = actionReducer(initialState, { type: "UP" });

    // Assert
    expect(newState.cursorIndex).toBe(0);
  });

  it("should toggle selection for selectable branch", () => {
    // Arrange
    initialState.cursorIndex = 1;

    // Act
    const newState = actionReducer(initialState, { type: "TOGGLE" });

    // Assert
    expect(newState.branches[1]!.isSelected).toBe(true);
  });

  it("should call git delete when toggling a selected branch", () => {
    // Arrange
    initialState.cursorIndex = 1;
    initialState.branches[1]!.isSelected = true;

    // Mock getLocalBranches to return remaining branches
    vi.mocked(getLocalBranches.getLocalBranches).mockReturnValue([
      { name: "main", isSelected: false, isSelectable: false, isCurrent: true },
      {
        name: "feature/2",
        isSelected: false,
        isSelectable: true,
        isCurrent: false,
      },
    ]);

    // Act
    const newState = actionReducer(initialState, { type: "TOGGLE" });

    // Assert
    expect(execFileSync).toHaveBeenCalledWith(
      "git",
      ["branch", "-d", "feature/1"],
      { stdio: "pipe" },
    );
    expect(newState.branches).toHaveLength(2);
    expect(newState.message?.type).toBe("success");
  });

  it("should handle delete error", () => {
    // Arrange
    initialState.cursorIndex = 1;
    initialState.branches[1]!.isSelected = true;

    const error = new Error("Failed to delete");
    (error as Error & { stderr: Buffer }).stderr = Buffer.from("error message");
    vi.mocked(execFileSync).mockImplementation(() => {
      throw error;
    });

    // Act
    const newState = actionReducer(initialState, { type: "TOGGLE" });

    // Assert
    expect(newState.message?.type).toBe("error");
    expect(newState.branches[1]!.isSelected).toBe(false);
  });
});
