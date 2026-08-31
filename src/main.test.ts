import * as fs from "node:fs";
import {
	afterEach,
	assert,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { KEY_EVENT } from "./const/keyEvent";
import { main } from "./main";
import { actionReducer } from "./modules/actionReducer";
import { checkForUpdate } from "./modules/checkForUpdate";
import { loadConfig } from "./modules/config";
import { getLocalBranches } from "./modules/getLocalBranches";
import { postprocess } from "./modules/postprocess";
import { preprocess } from "./modules/preprocess";
import { render } from "./modules/render";
import type { BranchState } from "./type/branchState";

// Mock dependencies
vi.mock("node:fs");
vi.mock("node:path", () => ({
	join: (...args: string[]) => args.join("/"),
	dirname: (path: string) => path.split("/").slice(0, -1).join("/"),
}));
vi.mock("./modules/getLocalBranches");
vi.mock("./modules/config");
vi.mock("./modules/actionReducer");
vi.mock("./modules/render");
vi.mock("./modules/postprocess");
vi.mock("./modules/preprocess");
vi.mock("./modules/printErrorAndSetExitCode");
vi.mock("./modules/checkForUpdate");

describe("main", () => {
	let mockStdin: {
		on: ReturnType<typeof vi.fn>;
		off: ReturnType<typeof vi.fn>;
		toString: ReturnType<typeof vi.fn>;
	};
	let exitSpy: ReturnType<typeof vi.spyOn>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

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
			argv: ["node", "script"], // Default args
			cwd: () => "/app",
			exit: vi.fn(),
		});

		exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Default mock returns
		vi.mocked(fs.existsSync).mockReturnValue(true); // Default to valid git repo
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({ version: "1.0.0" }),
		);
		vi.mocked(getLocalBranches).mockReturnValue([
			{ name: "main", isSelected: false, isCurrent: true, isSelectable: false },
		]);
		vi.mocked(loadConfig).mockReturnValue({
			showBanner: true,
			checkForUpdates: true,
		});
		vi.mocked(actionReducer).mockImplementation((state) => state);
		vi.mocked(checkForUpdate).mockResolvedValue(null);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("should show help and exit when --help is passed", () => {
		vi.stubGlobal("process", {
			...process,
			argv: ["node", "script", "--help"],
			exit: exitSpy,
		});
		main();
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Usage: home-pruner"),
		);
		expect(exitSpy).toHaveBeenCalledWith(0);
	});

	it("should show version and exit when --version is passed", () => {
		vi.stubGlobal("process", {
			...process,
			argv: ["node", "script", "--version"],
			exit: exitSpy,
		});
		main();
		expect(consoleLogSpy).toHaveBeenCalledWith("v1.0.0");
		expect(exitSpy).toHaveBeenCalledWith(0);
	});

	it("should handle unknown version gracefuly", () => {
		vi.stubGlobal("process", {
			...process,
			argv: ["node", "script", "--version"],
			exit: exitSpy,
		});
		vi.mocked(fs.readFileSync).mockImplementation(() => {
			throw new Error();
		});
		main();
		expect(consoleLogSpy).toHaveBeenCalledWith("Unknown version");
		expect(exitSpy).toHaveBeenCalledWith(0);
	});

	it("should error and exit if not a git repository", () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		main();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("not a git repository"),
		);
		expect(exitSpy).toHaveBeenCalledWith(1);
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
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData("q");

		// Assert
		expect(mockStdin.off).toHaveBeenCalledWith("data", onData);
		expect(postprocess).toHaveBeenCalled();
	});

	it("should dispatch DOWN action when 'k' is pressed (Input Handling)", () => {
		// Arrange
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData("k");

		// Assert
		expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), "DOWN");
		expect(render).toHaveBeenCalled();
	});

	it("should dispatch UP action when 'i' is pressed (Input Handling)", () => {
		// Arrange
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData("i");

		// Assert
		expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), "UP");
		expect(render).toHaveBeenCalled();
	});

	it("should dispatch FORCE_DELETE action when 'f' is pressed (Input Handling)", () => {
		// Arrange
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData("f");

		// Assert
		expect(actionReducer).toHaveBeenCalledWith(
			expect.any(Object),
			"FORCE_DELETE",
		);
		expect(render).toHaveBeenCalled();
	});

	it("should dispatch TOGGLE_BANNER action when 't' is pressed (Input Handling)", () => {
		// Arrange
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData("t");

		// Assert
		expect(actionReducer).toHaveBeenCalledWith(
			expect.any(Object),
			"TOGGLE_BANNER",
		);
		expect(render).toHaveBeenCalled();
	});

	it("should dispatch TOGGLE action when ENTER is pressed (Input Handling)", () => {
		// Arrange
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData(KEY_EVENT.ENTER);

		// Assert
		expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), "TOGGLE");
		expect(render).toHaveBeenCalled();
	});

	it("should dispatch UP action when Arrow Up is pressed (Input Handling)", () => {
		// Arrange
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];

		// Act
		onData(KEY_EVENT.ARROW_UP);

		// Assert
		expect(actionReducer).toHaveBeenCalledWith(expect.any(Object), "UP");
		expect(render).toHaveBeenCalled();
	});

	it("should re-render with update info when a newer version is available", async () => {
		// Arrange
		vi.mocked(checkForUpdate).mockResolvedValue("2.0.0");

		// Act
		main();
		await vi.waitFor(() => {
			expect(checkForUpdate).toHaveBeenCalled();
		});
		// allow the checkForUpdate promise chain to settle
		await Promise.resolve();
		await Promise.resolve();

		// Assert
		expect(render).toHaveBeenLastCalledWith(
			expect.objectContaining({
				updateAvailable: { current: "1.0.0", latest: "2.0.0" },
			}),
		);
	});

	it("should not check for updates when disabled in config", () => {
		// Arrange
		vi.mocked(loadConfig).mockReturnValue({
			showBanner: true,
			checkForUpdates: false,
		});

		// Act
		main();

		// Assert
		expect(checkForUpdate).not.toHaveBeenCalled();
	});

	it("should not re-render after the session has ended", async () => {
		// Arrange
		vi.mocked(checkForUpdate).mockResolvedValue("2.0.0");

		// Act
		main();
		const mockedStdin = vi.mocked(mockStdin.on);
		assert.ok(mockedStdin.mock.calls[0]);
		const onData = mockedStdin.mock.calls[0][1];
		onData("q");
		vi.mocked(render).mockClear();

		await vi.waitFor(() => {
			expect(checkForUpdate).toHaveBeenCalled();
		});
		await Promise.resolve();
		await Promise.resolve();

		// Assert
		expect(render).not.toHaveBeenCalled();
	});
});
