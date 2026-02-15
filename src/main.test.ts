import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { main } from "./main";
import { getLocalBranches } from "./modules/getLocalBranches";
import { loadConfig } from "./modules/config";
import { actionReducer } from "./modules/actionReducer";
import { render } from "./modules/render";
import { postprocess } from "./modules/postprocess";
import { preprocess } from "./modules/preprocess";
import { KEY_EVENT } from "./const/keyEvent";
import type { BranchState } from "./type/branchState";

// Mock dependencies
vi.mock("./modules/getLocalBranches");
vi.mock("./modules/config");
vi.mock("./modules/actionReducer");
vi.mock("./modules/render");
vi.mock("./modules/postprocess");
vi.mock("./modules/preprocess");
vi.mock("./modules/printErrorAndSetExitCode");

describe("main", () => {
  let mockStdin: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    toString: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock stdin
    mockStdin = {
      on: vi.fn(),
      off: vi.fn(),
      toString: vi.fn().mockReturnValue("stdin"),
    };
    vi.stubGlobal("process", {
      ...process,
      stdin: mockStdin,
    });

    // Default mock returns
    vi.mocked(getLocalBranches).mockReturnValue([
      { name: "main", isSelected: false, isCurrent: true, isSelectable: false },
    ]);
    vi.mocked(loadConfig).mockReturnValue({ showBanner: true });
    vi.mocked(actionReducer).mockImplementation((state) => state);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should initialize the application correctly (Initialization)", () => {
    // Arrange
    const expectedInitialState: BranchState = {
      branches: [
        {
          name: "main",
          isSelected: false,
          isCurrent: true,
          isSelectable: false,
        },
      ],
      cursorIndex: 0,
      showBanner: true,
    };

    // Act
    main();

    // Assert
    expect(getLocalBranches).toHaveBeenCalled();
    expect(loadConfig).toHaveBeenCalled();
    expect(preprocess).toHaveBeenCalledWith(expectedInitialState);
    expect(mockStdin.on).toHaveBeenCalledWith("data", expect.any(Function));
  });

  it("should terminate the application when 'q' is pressed (Termination)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData("q");

    // Assert
    expect(mockStdin.off).toHaveBeenCalledWith("data", onData);
    expect(postprocess).toHaveBeenCalled();
  });

  it("should dispatch DOWN action when 'k' is pressed (Input Handling)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData("k");

    // Assert
    expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), {
      type: "DOWN",
    });
    expect(render).toHaveBeenCalled();
  });

  it("should dispatch UP action when 'i' is pressed (Input Handling)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData("i");

    // Assert
    expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), {
      type: "UP",
    });
    expect(render).toHaveBeenCalled();
  });

  it("should dispatch FORCE_DELETE action when 'f' is pressed (Input Handling)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData("f");

    // Assert
    expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), {
      type: "FORCE_DELETE",
    });
    expect(render).toHaveBeenCalled();
  });

  it("should dispatch TOGGLE_BANNER action when 't' is pressed (Input Handling)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData("t");

    // Assert
    expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), {
      type: "TOGGLE_BANNER",
    });
    expect(render).toHaveBeenCalled();
  });

  it("should dispatch TOGGLE action when ENTER is pressed (Input Handling)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData(KEY_EVENT.ENTER);

    // Assert
    expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), {
      type: "TOGGLE",
    });
    expect(render).toHaveBeenCalled();
  });

  it("should dispatch UP action when Arrow Up is pressed (Input Handling)", () => {
    // Arrange
    main();
    const onData = vi.mocked(mockStdin.on).mock.calls[0]![1];

    // Act
    onData(KEY_EVENT.ARROW_UP);

    // Assert
    expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), {
      type: "UP",
    });
    expect(render).toHaveBeenCalled();
  });
});
