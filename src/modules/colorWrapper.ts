import { ANSI_COLORS } from "../const/colors";

const RESET = "\x1b[0m";

function wrap(code: string) {
  return (text: string) => `${code}${text}${RESET}`;
}

export const red = wrap(ANSI_COLORS.RED);
export const green = wrap(ANSI_COLORS.GREEN);
export const gray = wrap(ANSI_COLORS.GRAY);
export const cyan = wrap(ANSI_COLORS.CYAN);
export const reverse = wrap(ANSI_COLORS.REVERSE);
