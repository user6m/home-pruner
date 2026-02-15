import { describe, it, expect } from "vitest";
import { red, green, gray, cyan, reverse } from "./colorWrapper";
import { ANSI_COLORS } from "../const/colors";

const RESET = "\x1b[0m";

describe("colorWrapper", () => {
  it("should wrap text in red", () => {
    // Arrange
    const text = "error";

    // Act
    const result = red(text);

    // Assert
    expect(result).toBe(`${ANSI_COLORS.RED}${text}${RESET}`);
  });

  it("should wrap text in green", () => {
    // Arrange
    const text = "success";

    // Act
    const result = green(text);

    // Assert
    expect(result).toBe(`${ANSI_COLORS.GREEN}${text}${RESET}`);
  });

  it("should wrap text in gray", () => {
    // Arrange
    const text = "disabled";

    // Act
    const result = gray(text);

    // Assert
    expect(result).toBe(`${ANSI_COLORS.GRAY}${text}${RESET}`);
  });

  it("should wrap text in cyan", () => {
    // Arrange
    const text = "info";

    // Act
    const result = cyan(text);

    // Assert
    expect(result).toBe(`${ANSI_COLORS.CYAN}${text}${RESET}`);
  });

  it("should wrap text in reverse", () => {
    // Arrange
    const text = "highlight";

    // Act
    const result = reverse(text);

    // Assert
    expect(result).toBe(`${ANSI_COLORS.REVERSE}${text}${RESET}`);
  });
});
