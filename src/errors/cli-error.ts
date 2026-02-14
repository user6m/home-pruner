export type CliErrorCode = "NOT_GIT_REPO" | "GIT_COMMAND_FAILED" | "UNKNOWN";

type CliErrorOptions = {
  code: CliErrorCode;
  userMessage: string;
  cause?: unknown;
};

export class CliError extends Error {
  public readonly code: CliErrorCode;
  public readonly userMessage: string;
  public override readonly cause?: unknown;

  constructor(opts: CliErrorOptions) {
    super(opts.userMessage);
    this.name = "CliError";

    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.cause = opts.cause;
  }
}

export function isCliError(e: unknown): e is CliError {
  return e instanceof CliError;
}

export function toUnknownCliError(e: unknown): CliError {
  if (isCliError(e)) return e;

  return new CliError({
    code: "UNKNOWN",
    userMessage: "Something went wrong.",
    cause: e,
  });
}
