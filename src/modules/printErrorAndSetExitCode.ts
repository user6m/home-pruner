import { isCliError, toUnknownCliError } from "../errors/cli-error";

const DEBUG = process.argv.includes("--debug");

export function printErrorAndSetExitCode(e: unknown) {
  const err = toUnknownCliError(e);

  console.error(`[!Error]home-pruner: ${err.userMessage}`);
  process.exitCode = 1;

  if (DEBUG) {
    console.error("---- debug ----");
    console.error("code:", err.code);
    if (err.cause) console.error("cause:", err.cause);
    if (!isCliError(e) && e instanceof Error) console.error(e.stack);
    console.error("--------------");
  }
}
