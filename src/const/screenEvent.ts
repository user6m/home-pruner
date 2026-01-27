export enum SCREEN_EVENT {
  HIDE_PIPE = "\x1b[?25l",
  SHOW_PIPE = "\x1b[?25h",
  CLEAR_SCREEN = "\x1b[2J",
  MOVE_CURSOR_HOME = "\x1b[H",
  INVERT_COLORS = "\x1b[7m",
  RESET_COLORS = "\x1b[0m",
  ENTER_ALT_SCREEN = "\x1b[?1049h",
  EXIT_ALT_SCREEN = "\x1b[?1049l",
}
