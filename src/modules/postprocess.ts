import { SCREEN_EVENT } from "../const/screenEvent";

export function postprocess() {
  const stdout = process.stdout;
  const stdin = process.stdin;
  const builder = [];

  builder.push(SCREEN_EVENT.EXIT_ALT_SCREEN);
  builder.push(SCREEN_EVENT.SHOW_PIPE);
  stdout.write(builder.join(""));

  if (stdin.isRaw) stdin.setRawMode(false);
  stdin.pause();
}
