import { describe, it, expect } from "vitest";
import { CliError, isCliError, toUnknownCliError } from "./cli-error";

describe("CliError", () => {
  describe("CliError class", () => {
    it("should create an instance with correct properties", () => {
      // Arrange
      const cause = new Error("original error");
      const opts = {
        code: "GIT_COMMAND_FAILED" as const,
        userMessage: "Failed to run git command",
        cause,
      };

      // Act
      const error = new CliError(opts);

      // Assert
      expect(error).toBeInstanceOf(CliError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("CliError");
      expect(error.code).toBe("GIT_COMMAND_FAILED");
      expect(error.userMessage).toBe("Failed to run git command");
      expect(error.message).toBe("Failed to run git command");
      expect(error.cause).toBe(cause);
    });

    it("should work without cause", () => {
      // Arrange
      const opts = {
        code: "NOT_GIT_REPO" as const,
        userMessage: "Not a git repo",
      };

      // Act
      const error = new CliError(opts);

      // Assert
      expect(error.cause).toBeUndefined();
    });
  });

  describe("isCliError", () => {
    it("should return true for CliError instances", () => {
      const error = new CliError({ code: "UNKNOWN", userMessage: "msg" });
      expect(isCliError(error)).toBe(true);
    });

    it("should return false for normal Error instances", () => {
      const error = new Error("msg");
      expect(isCliError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(isCliError({ code: "UNKNOWN" })).toBe(false);
      expect(isCliError(null)).toBe(false);
      expect(isCliError(undefined)).toBe(false);
    });
  });

  describe("toUnknownCliError", () => {
    it("should return the same object if it is already a CliError", () => {
      const error = new CliError({
        code: "GIT_COMMAND_FAILED",
        userMessage: "msg",
      });
      const result = toUnknownCliError(error);
      expect(result).toBe(error);
    });

    it("should wrap unknown errors into an UNKNOWN CliError", () => {
      const original = new Error("something went wrong");
      const result = toUnknownCliError(original);

      expect(result).toBeInstanceOf(CliError);
      expect(result.code).toBe("UNKNOWN");
      expect(result.userMessage).toBe("Something went wrong.");
      expect(result.cause).toBe(original);
    });

    it("should wrap non-error values", () => {
      const original = "string error";
      const result = toUnknownCliError(original);

      expect(result.code).toBe("UNKNOWN");
      expect(result.cause).toBe(original);
    });
  });
});
