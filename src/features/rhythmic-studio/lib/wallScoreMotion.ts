import type { NoteEvent } from "../types";

export const WALL_SCORE_RAIL_MIN_GAP_MS = 760;
export const WALL_SCORE_LONG_RAIL_SPEED = 230;
export const WALL_SCORE_VERTICAL_PIPE_SPEED = 180;
export const WALL_SCORE_LONG_RAIL_ENTRY_T = 0.12;
export const WALL_SCORE_LONG_RAIL_EXIT_T = 0.88;
export const WALL_SCORE_HORIZONTAL_RAIL_ENTRY_T = 0.03;
export const WALL_SCORE_HORIZONTAL_RAIL_EXIT_T = 0.97;
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

const clamp = (value: number, min = 0, max = 1) => (
  Math.min(max, Math.max(min, value))
);

function minimumTravelSpeed(gapMs: number) {
  if (gapMs >= WALL_SCORE_RAIL_MIN_GAP_MS) return WALL_SCORE_LONG_RAIL_SPEED;
  if (gapMs >= 420) return 180;
  return 0;
}

function routeToOtherColumn(
  previous: WallScoreMotionPoint,
  desiredDistance: number,
  width: number,
) {
  const left = width * 0.16;
  const right = width * 0.84;
  const primaryDirection = previous.x <= width / 2 ? 1 : -1;
  const available = (direction: number) => (
    direction > 0 ? right - previous.x : previous.x - left
  );
  const direction = available(primaryDirection) >= desiredDistance
    ? primaryDirection
    : available(-primaryDirection) >= desiredDistance
      ? -primaryDirection
      : 0;
  if (!direction) return undefined;
  return {
    x: previous.x + direction * desiredDistance,
    y: previous.y,
  };
}

/**
 * Keep short phrases in their measured clusters. A long rest either crosses
 * to another instrument column on a level rail, or drops through a vertical
 * pipe when the required travel no longer fits safely across the stage.
 */
export function spaceWallScoreHitsByTiming(
  events: readonly NoteEvent[],
  sourceHits: readonly WallScoreMotionPoint[],
  width = 720,
) {
  if (!sourceHits.length) return [];
  const result: WallScoreMotionPoint[] = [{ ...sourceHits[0] }];
  let offsetX = 0;
  let offsetY = 0;
  const minX = width * 0.12;
  const maxX = width * 0.88;

  for (let index = 1; index < sourceHits.length; index += 1) {
    const source = sourceHits[index];
    const previous = result[index - 1];
    const gapMs = Math.max(1, events[index].timeMs - events[index - 1].timeMs);
    const proposed = {
      x: clamp(source.x + offsetX, minX, maxX),
      y: source.y + offsetY,
    };

    if (gapMs >= WALL_SCORE_RAIL_MIN_GAP_MS) {
      const naturalDistance = WALL_SCORE_LONG_RAIL_SPEED * gapMs / 1_000;
      const railDistance = Math.max(WALL_SCORE_MIN_COLUMN_CHANGE, naturalDistance);
      const railTarget = routeToOtherColumn(previous, railDistance, width);
      const target = railTarget ?? {
        x: previous.x,
        y: previous.y + WALL_SCORE_VERTICAL_PIPE_SPEED * gapMs / 1_000,
      };
      result.push(target);
      offsetX += target.x - proposed.x;
      offsetY += target.y - proposed.y;
      continue;
    }

    const targetDistance = minimumTravelSpeed(gapMs) * gapMs / 1_000;
    const dx = proposed.x - previous.x;
    const dy = proposed.y - previous.y;
    const currentDistance = Math.hypot(dx, dy);
    if (targetDistance > currentDistance && targetDistance > Math.abs(dx)) {
      const requiredDy = Math.sqrt(targetDistance ** 2 - dx ** 2);
      const extraY = Math.max(0, requiredDy - dy);
      proposed.y += extraY;
      offsetY += extraY;
    }
    result.push(proposed);
  }

  return result;
}

export function wallScoreLongRouteKind(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
): WallScoreLongRouteKind | undefined {
  if (spanMs < WALL_SCORE_RAIL_MIN_GAP_MS) return undefined;
  if (Math.abs(end.y - start.y) < 1e-6 && Math.abs(end.x - start.x) > 1) {
    return "horizontal-rail";
  }
  if (Math.abs(end.x - start.x) < 1e-6 && end.y > start.y) {
    return "vertical-pipe";
  }
  return undefined;
}

export function wallScoreLongRouteMotion(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  kind: WallScoreLongRouteKind,
): WallScoreLongRouteMotion {
  const seconds = Math.max(0.001, spanMs / 1_000);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const pathLength = Math.max(1, Math.hypot(dx, dy));
  const averageSpeed = pathLength / seconds;
  if (kind === "vertical-pipe") {
    const launchSpeed = 80;
    const gravity = 2 * (dy + launchSpeed * seconds) / seconds ** 2;
    return {
      kind,
      pathLength,
      gravity,
      startVelocity: { x: 0, y: -launchSpeed },
      endVelocity: { x: 0, y: -launchSpeed + gravity * seconds },
    };
  }
  const direction = kind === "horizontal-rail"
    ? { x: Math.sign(dx), y: 0 }
    : { x: 0, y: Math.sign(dy) };
  const startFactor = 1.28;
  const endFactor = 0.72;

  return {
    kind,
    pathLength,
    gravity: 0,
    startVelocity: {
      x: direction.x * averageSpeed * startFactor,
      y: direction.y * averageSpeed * startFactor,
    },
    endVelocity: {
      x: direction.x * averageSpeed * endFactor,
      y: direction.y * averageSpeed * endFactor,
    },
  };
}

function routeDistancePhase(phase: number, kind: WallScoreLongRouteKind) {
  if (kind === "horizontal-rail") {
    // Momentum plus rolling resistance: speed decreases monotonically while
    // the marble remains supported by a level rail.
    return 1.28 * phase - 0.28 * phase ** 2;
  }
  return phase;
}

export function wallScoreLongRoutePoint(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  phase: number,
  kind: WallScoreLongRouteKind,
) {
  const p = clamp(phase);
  if (kind === "vertical-pipe") {
    const motion = wallScoreLongRouteMotion(start, end, spanMs, kind);
    const elapsed = Math.max(0.001, spanMs / 1_000) * p;
    return {
      x: start.x,
      y: start.y + motion.startVelocity.y * elapsed
        + 0.5 * motion.gravity * elapsed ** 2,
    };
  }
  const distancePhase = routeDistancePhase(p, kind);
  return {
    x: start.x + (end.x - start.x) * distancePhase,
    y: start.y + (end.y - start.y) * distancePhase,
  };
}
