import { describe, it, expect } from "vitest";
import { buildLocalBranches } from "./buildLocalBranches";

describe("buildLocalBranches", () => {
  it("should return a sorted list of branches", () => {
    // Arrange
    const currentBranchName = "main";
    const localBranchNames = ["feature-10", "main", "feature-2", "feature-1"];

    // Act
    const result = buildLocalBranches(currentBranchName, localBranchNames);

    // Assert
    expect(result.length).toBe(4);
    expect(result[0]?.name).toBe("feature-1");
    expect(result[1]?.name).toBe("feature-2");
    expect(result[2]?.name).toBe("feature-10");
    expect(result[3]?.name).toBe("main");
  });

  it("should correctly identify current and selectable branches", () => {
    // Arrange
    const currentBranchName = "main";
    const localBranchNames = ["feature-1", "main"];

    // Act
    const result = buildLocalBranches(currentBranchName, localBranchNames);

    // Assert
    const feature1 = result.find((b) => b.name === "feature-1");
    const main = result.find((b) => b.name === "main");

    expect(feature1).toEqual({
      name: "feature-1",
      isCurrent: false,
      isSelectable: true,
      isSelected: false,
    });
    expect(main).toEqual({
      name: "main",
      isCurrent: true,
      isSelectable: false,
      isSelected: false,
    });
  });

  it("should handle an empty list of branches", () => {
    // Arrange
    const currentBranchName = "main";
    const localBranchNames: string[] = [];

    // Act
    const result = buildLocalBranches(currentBranchName, localBranchNames);

    // Assert
    expect(result).toEqual([]);
  });

  it("should handle numeric sorting correctly", () => {
    // Arrange
    const currentBranchName = "main";
    const localBranchNames = ["v1.2", "v1.10", "v1.1"];

    // Act
    const result = buildLocalBranches(currentBranchName, localBranchNames);

    // Assert
    expect(result.map((b) => b.name)).toEqual(["v1.1", "v1.2", "v1.10"]);
  });
});
