import type { NoteEvent } from "../types";
import {
  WALL_SCORE_LONG_RAIL_SPEED,
  WALL_SCORE_MIN_COLUMN_CHANGE,
  WALL_SCORE_RAIL_MIN_GAP_MS,
  WALL_SCORE_VERTICAL_PIPE_DROP_SPEED,
  type WallScoreLongRouteKind,
  type WallScoreMotionPoint,
} from "./wallScoreMotionTypes";

export * from "./wallScoreGuideMotion";
export * from "./wallScoreMotionTypes";

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
  options: { preserveSourceColumns?: boolean } = {},
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
      x: clamp(source.x + (options.preserveSourceColumns ? 0 : offsetX), minX, maxX),
      y: source.y + offsetY,
    };
    if (options.preserveSourceColumns && gapMs >= 170 && gapMs < WALL_SCORE_RAIL_MIN_GAP_MS) {
      const center = width / 2;
      const previousSide = Math.sign(previous.x - center);
      const proposedSide = Math.sign(proposed.x - center);
      if (previousSide !== 0 && proposedSide === previousSide) {
        proposed.x = center - previousSide * Math.abs(proposed.x - center);
      }
    }

    if (gapMs >= WALL_SCORE_RAIL_MIN_GAP_MS) {
      const naturalDistance = WALL_SCORE_LONG_RAIL_SPEED * gapMs / 1_000;
      const railDistance = Math.max(WALL_SCORE_MIN_COLUMN_CHANGE + 0.01, naturalDistance);
      const sourceColumnDistance = Math.abs(proposed.x - previous.x);
      const railDirection = Math.sign(proposed.x - previous.x);
      const openCenterClearance = width * 0.14;
      const speedTargetX = previous.x + railDirection * railDistance;
      const openLaneTargetX = width / 2 + railDirection * openCenterClearance;
      const physicalRailX = railDirection > 0
        ? Math.max(speedTargetX, openLaneTargetX)
        : Math.min(speedTargetX, openLaneTargetX);
      const preservedRailTarget = options.preserveSourceColumns
        && railDirection !== 0
        && sourceColumnDistance >= WALL_SCORE_MIN_COLUMN_CHANGE
        && physicalRailX >= minX
        && physicalRailX <= maxX
        ? { x: physicalRailX, y: previous.y }
        : undefined;
      const railTarget = preservedRailTarget
        ?? (options.preserveSourceColumns ? undefined : routeToOtherColumn(previous, railDistance, width));
      const target = railTarget ?? {
        x: previous.x,
        y: previous.y + WALL_SCORE_VERTICAL_PIPE_DROP_SPEED * gapMs / 1_000,
      };
      result.push(target);
      if (!options.preserveSourceColumns) offsetX += target.x - proposed.x;
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
