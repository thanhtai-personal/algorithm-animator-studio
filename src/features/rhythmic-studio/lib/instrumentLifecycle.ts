import type { PlatformStyle } from "../types";

const PLAYED_TUBE_COLOR = "#18191d";

export function instrumentBodyColorAtTime(
  style: PlatformStyle,
  noteColor: string,
  hitTimeMs: number,
  timeMs: number,
) {
  if (style === "wall-boomwhacker-tube") {
    return timeMs < hitTimeMs ? PLAYED_TUBE_COLOR : noteColor;
  }
  if (style !== "boomwhacker-tube" || timeMs < hitTimeMs + 180) return noteColor;
  return PLAYED_TUBE_COLOR;
}
