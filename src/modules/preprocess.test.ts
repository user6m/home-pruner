import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { preprocess } from "./preprocess";
import { SCREEN_EVENT } from "../const/screenEvent";
import { render } from "./render";
import type { ReadStream } from "tty";
import type { BranchState } from "../type/branchState";

vi.mock("./render");

describe("preprocess", () => {
  let stdoutWriteSpy: MockInstance;
  let stdinSetEncodingSpy: MockInstance;
  let stdinSetRawModeSpy: MockInstance;

  const mockBranchState: BranchState = {
    branches: [],
    cursorIndex: 0,
    showBanner: true,
  };

  beforeEach(() => {
    stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const stdin = process.stdin as unknown as ReadStream;

    // Mock setEncoding if it doesn't exist
    if (!stdin.setEncoding) {
      stdin.setEncoding = vi.fn();
    }
    stdinSetEncodingSpy = vi.spyOn(stdin, "setEncoding").mockReturnValue(stdin);

    // Mock setRawMode if it doesn't exist
    if (!stdin.setRawMode) {
      stdin.setRawMode = vi.fn();
    }
    stdinSetRawModeSpy = vi.spyOn(stdin, "setRawMode").mockReturnValue(stdin);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should write initialization screen events to stdout", () => {
    // Arrange
    // (mockBranchState is ready)

    // Act
    preprocess(mockBranchState);

    // Assert
    expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
    const output = stdoutWriteSpy.mock.calls[0]![0];
    expect(output).toContain(SCREEN_EVENT.ENTER_ALT_SCREEN);
    expect(output).toContain(SCREEN_EVENT.HIDE_PIPE);
    expect(output).toContain(SCREEN_EVENT.MOVE_CURSOR_HOME);
  });

  it("should set stdin encoding to utf-8", () => {
    // Arrange
    // (mockBranchState is ready)

    // Act
    preprocess(mockBranchState);

    // Assert
    expect(stdinSetEncodingSpy).toHaveBeenCalledWith("utf-8");
  });

  it("should enable stdin raw mode", () => {
    // Arrange
    // (mockBranchState is ready)

    // Act
    preprocess(mockBranchState);

    // Assert
    expect(stdinSetRawModeSpy).toHaveBeenCalledWith(true);
  });

  it("should call initial render with provided state", () => {
    // Arrange
    const state = { ...mockBranchState };

    // Act
    preprocess(state);

    // Assert
    expect(render).toHaveBeenCalledWith(state);
  });
});
