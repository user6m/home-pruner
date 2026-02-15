import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { postprocess } from "./postprocess";
import { SCREEN_EVENT } from "../const/screenEvent";
import type { ReadStream } from "tty";

describe("postprocess", () => {
  let stdoutWriteSpy: MockInstance;
  let stdinSetRawModeSpy: MockInstance;
  let stdinPauseSpy: MockInstance;

  beforeEach(() => {
    // Mock isRaw with getter/setter to ensure we can control it
    let isRawInternal = false;
    Object.defineProperty(process.stdin, "isRaw", {
      get: () => isRawInternal,
      set: (v) => {
        isRawInternal = v;
      },
      configurable: true,
    });

    stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    // Cast process.stdin to ReadStream (tty) to access setRawMode
    const stdin = process.stdin as unknown as ReadStream;

    // Mock setRawMode if it doesn't exist
    if (!stdin.setRawMode) {
      stdin.setRawMode = vi.fn();
    }
    stdinSetRawModeSpy = vi.spyOn(stdin, "setRawMode").mockReturnValue(stdin);

    // Mock pause if it doesn't exist (though usually it does as it's a stream)
    if (!stdin.pause) {
      stdin.pause = vi.fn();
    }
    stdinPauseSpy = vi.spyOn(stdin, "pause").mockReturnValue(stdin);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should write exit screen events to stdout", () => {
    // Arrange
    // (Ensure isRaw is false to isolate this test case)
    process.stdin.isRaw = false;

    // Act
    postprocess();

    // Assert
    expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
    const output = stdoutWriteSpy.mock.calls[0]![0];
    expect(output).toContain(SCREEN_EVENT.EXIT_ALT_SCREEN);
    expect(output).toContain(SCREEN_EVENT.SHOW_PIPE);
  });

  it("should disable raw mode if enabled", () => {
    // Arrange
    process.stdin.isRaw = true;

    // Act
    postprocess();

    // Assert
    expect(stdinSetRawModeSpy).toHaveBeenCalledWith(false);
  });

  it("should not disable raw mode if already disabled", () => {
    // Arrange
    process.stdin.isRaw = false;

    // Act
    postprocess();

    // Assert
    expect(stdinSetRawModeSpy).not.toHaveBeenCalled();
  });

  it("should pause stdin", () => {
    // Arrange
    process.stdin.isRaw = false;

    // Act
    postprocess();

    // Assert
    expect(stdinPauseSpy).toHaveBeenCalledTimes(1);
  });
});
