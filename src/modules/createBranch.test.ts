import { describe, it, expect } from "vitest";
import { createBranch } from "./createBranch";

describe("createBranch", () => {
  it("should create a current branch object when names match", () => {
    // Arrange
    const name = "main";
    const currentBranchName = "main";

    // Act
    const result = createBranch(name, currentBranchName);

    // Assert
    expect(result).toEqual({
      name: "main",
      isCurrent: true,
      isSelectable: false,
      isSelected: false,
    });
  });

  it("should create a selectable branch object when names do not match", () => {
    // Arrange
    const name = "feature-1";
    const currentBranchName = "main";

    // Act
    const result = createBranch(name, currentBranchName);

    // Assert
    expect(result).toEqual({
      name: "feature-1",
      isCurrent: false,
      isSelectable: true,
      isSelected: false,
    });
  });

  it("should handle empty current branch name correctly", () => {
    // Arrange
    const name = "main";
    const currentBranchName = "";

    // Act
    const result = createBranch(name, currentBranchName);

    // Assert
    expect(result.isCurrent).toBe(false);
    expect(result.isSelectable).toBe(true);
  });
});
