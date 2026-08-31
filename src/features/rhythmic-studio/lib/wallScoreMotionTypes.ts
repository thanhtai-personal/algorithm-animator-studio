export const WALL_SCORE_RAIL_MIN_GAP_MS = 760;
export const WALL_SCORE_LONG_RAIL_SPEED = 230;
export const WALL_SCORE_VERTICAL_PIPE_SPEED = 255;
export const WALL_SCORE_VERTICAL_PIPE_DROP_SPEED = 150;
export const WALL_SCORE_LONG_RAIL_ENTRY_T = 0.18;
export const WALL_SCORE_LONG_RAIL_EXIT_T = 0.82;
export const WALL_SCORE_HORIZONTAL_RAIL_ENTRY_T = 0.18;
export const WALL_SCORE_HORIZONTAL_RAIL_EXIT_T = 0.82;
export const WALL_SCORE_MIN_COLUMN_CHANGE = 240;

export type WallScoreLongRouteKind = "horizontal-rail" | "vertical-pipe";

export interface WallScoreMotionPoint {
  x: number;
  y: number;
}

export interface WallScoreLongRouteMotion {
  startVelocity: WallScoreMotionPoint;
  endVelocity: WallScoreMotionPoint;
  pathLength: number;
  kind: WallScoreLongRouteKind;
  gravity: number;
}

export interface WallScoreLongRouteGuideGeometry {
  entryT: number;
  exitT: number;
  entry: WallScoreMotionPoint;
  control1: WallScoreMotionPoint;
  control2: WallScoreMotionPoint;
  exit: WallScoreMotionPoint;
  startVelocity: WallScoreMotionPoint;
  exitVelocity: WallScoreMotionPoint;
  gravity: number;
  waveAmplitude: number;
  waveCount: number;
  waveDirection: number;
}
