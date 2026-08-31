import type { NoteEvent } from "../types";

export const WALL_SCORE_RAIL_MIN_GAP_MS = 760;
export const WALL_SCORE_LONG_RAIL_SPEED = 230;
export const WALL_SCORE_VERTICAL_PIPE_SPEED = 255;
// Keep the vertical screen progression compact. The marble itself still travels
// at WALL_SCORE_VERTICAL_PIPE_SPEED by gaining distance from the pipe's bends
// instead of being slowed down inside a short straight tube.
export const WALL_SCORE_VERTICAL_PIPE_DROP_SPEED = 150;
// Long guides intentionally occupy only the middle of the transition. The
// marble first leaves the struck instrument in free flight, lands on the guide,
// then leaves it again before the next strike. These exports remain for older
// callers; the exact phase window is resolved from the MIDI gap below.
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

const clamp = (value: number, min = 0, max = 1) => (
  Math.min(max, Math.max(min, value))
);

const guideGeometryCache = new Map<string, WallScoreLongRouteGuideGeometry>();

function guideGeometryCacheKey(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  kind: WallScoreLongRouteKind,
) {
  return `${kind}:${start.x}:${start.y}:${end.x}:${end.y}:${spanMs}`;
}

function cacheGuideGeometry(key: string, geometry: WallScoreLongRouteGuideGeometry) {
  if (guideGeometryCache.size >= 384) {
    const oldest = guideGeometryCache.keys().next().value;
    if (oldest !== undefined) guideGeometryCache.delete(oldest);
  }
  guideGeometryCache.set(key, geometry);
  return geometry;
}


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
      const railDistance = Math.max(WALL_SCORE_MIN_COLUMN_CHANGE, naturalDistance);
      const sourceColumnDistance = Math.abs(proposed.x - previous.x);
      const preservedRailTarget = options.preserveSourceColumns
        && sourceColumnDistance >= WALL_SCORE_MIN_COLUMN_CHANGE
        && sourceColumnDistance >= naturalDistance * 0.9
        ? { x: proposed.x, y: previous.y }
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

export function wallScoreLongRouteGuideWindow(spanMs: number, kind: WallScoreLongRouteKind) {
  const safeSpanMs = Math.max(1, spanMs);
  // A fixed ~0.2 s free-flight reads naturally across both an 818 ms musical
  // breath and a 4 s rest. Percentage-only windows made extra-long rests spend
  // nearly a second "floating" before touching the guide.
  const entryFlightMs = Math.min(kind === "horizontal-rail" ? 210 : 220, safeSpanMs * 0.22);
  const exitFlightMs = Math.min(kind === "horizontal-rail" ? 190 : 180, safeSpanMs * 0.2);
  return {
    entryT: clamp(entryFlightMs / safeSpanMs, 0.04, 0.28),
    exitT: clamp(1 - exitFlightMs / safeSpanMs, 0.72, 0.96),
  };
}

function solveBallisticVelocity(
  from: WallScoreMotionPoint,
  to: WallScoreMotionPoint,
  seconds: number,
  gravity: number,
) {
  const t = Math.max(0.001, seconds);
  return {
    x: (to.x - from.x) / t,
    y: (to.y - from.y - 0.5 * gravity * t * t) / t,
  };
}

function cubicPoint(
  start: WallScoreMotionPoint,
  control1: WallScoreMotionPoint,
  control2: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  t: number,
) {
  const p = clamp(t);
  const inv = 1 - p;
  const a = inv ** 3;
  const b = 3 * inv * inv * p;
  const c = 3 * inv * p * p;
  const d = p ** 3;
  return {
    x: a * start.x + b * control1.x + c * control2.x + d * end.x,
    y: a * start.y + b * control1.y + c * control2.y + d * end.y,
  };
}

function rawGuidePoint(geometry: WallScoreLongRouteGuideGeometry, t: number) {
  const p = clamp(t);
  const base = cubicPoint(
    geometry.entry,
    geometry.control1,
    geometry.control2,
    geometry.exit,
    p,
  );
  if (geometry.waveAmplitude <= 0 || geometry.waveCount <= 0) return base;
  // sin^2(pi*t) makes both the offset and its first derivative vanish at the
  // mouth of the pipe, so the free-flight entry/exit tangent stays continuous.
  const envelope = Math.sin(Math.PI * p) ** 2;
  const wave = Math.sin(Math.PI * 2 * geometry.waveCount * p)
    * geometry.waveAmplitude * envelope * geometry.waveDirection;
  return { x: base.x + wave, y: base.y };
}

function guideLength(geometry: WallScoreLongRouteGuideGeometry, steps = 96) {
  let total = 0;
  let previous = rawGuidePoint(geometry, 0);
  for (let index = 1; index <= steps; index += 1) {
    const point = rawGuidePoint(geometry, index / steps);
    total += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }
  return total;
}

interface GuideArcTable {
  points: WallScoreMotionPoint[];
  lengths: number[];
  total: number;
}

const guideArcTableCache = new WeakMap<WallScoreLongRouteGuideGeometry, GuideArcTable>();

function guideArcTable(geometry: WallScoreLongRouteGuideGeometry) {
  const cached = guideArcTableCache.get(geometry);
  if (cached) return cached;
  const steps = 120;
  const points = [rawGuidePoint(geometry, 0)];
  const lengths = [0];
  let total = 0;
  for (let index = 1; index <= steps; index += 1) {
    const point = rawGuidePoint(geometry, index / steps);
    const previous = points[index - 1];
    total += Math.hypot(point.x - previous.x, point.y - previous.y);
    points.push(point);
    lengths.push(total);
  }
  const table = { points, lengths, total };
  guideArcTableCache.set(geometry, table);
  return table;
}

function constantSpeedGuidePoint(geometry: WallScoreLongRouteGuideGeometry, phase: number) {
  const targetRatio = clamp(phase);
  const { points, lengths, total } = guideArcTable(geometry);
  if (total <= 1e-6) return points[0];
  const target = total * targetRatio;
  let low = 0;
  let high = lengths.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (lengths[mid] < target) low = mid + 1;
    else high = mid;
  }
  const upper = Math.max(1, low);
  const lower = upper - 1;
  const segmentLength = Math.max(1e-6, lengths[upper] - lengths[lower]);
  const local = (target - lengths[lower]) / segmentLength;
  return {
    x: points[lower].x + (points[upper].x - points[lower].x) * local,
    y: points[lower].y + (points[upper].y - points[lower].y) * local,
  };
}

function solvePipeWaveAmplitude(
  geometry: WallScoreLongRouteGuideGeometry,
  targetLength: number,
) {
  const verticalSpan = Math.abs(geometry.exit.y - geometry.entry.y);
  const minimumAmplitude = clamp(verticalSpan * 0.08, 10, 18);
  const maximumAmplitude = 76;
  const withAmplitude = (amplitude: number): WallScoreLongRouteGuideGeometry => ({
    ...geometry,
    waveAmplitude: amplitude,
  });
  if (guideLength(withAmplitude(minimumAmplitude)) >= targetLength) return minimumAmplitude;
  if (guideLength(withAmplitude(maximumAmplitude)) <= targetLength) return maximumAmplitude;
  let low = minimumAmplitude;
  let high = maximumAmplitude;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const mid = (low + high) / 2;
    if (guideLength(withAmplitude(mid)) < targetLength) low = mid;
    else high = mid;
  }
  return high;
}

export function wallScoreLongRouteGuideGeometry(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  kind: WallScoreLongRouteKind,
): WallScoreLongRouteGuideGeometry {
  const cacheKey = guideGeometryCacheKey(start, end, spanMs, kind);
  const cached = guideGeometryCache.get(cacheKey);
  if (cached) return cached;
  const seconds = Math.max(0.001, spanMs / 1_000);
  const { entryT, exitT } = wallScoreLongRouteGuideWindow(spanMs, kind);
  const entrySeconds = seconds * entryT;
  const exitSeconds = seconds * (1 - exitT);
  const guideSeconds = Math.max(0.001, seconds * (exitT - entryT));
  const gravity = kind === "horizontal-rail" ? 880 : 900;

  if (kind === "horizontal-rail") {
    const dx = end.x - start.x;
    const direction = Math.sign(dx) || 1;
    const liftDrop = Math.min(11, Math.max(7, Math.abs(dx) * 0.035));
    const entry = {
      x: start.x + dx * 0.22,
      y: start.y + liftDrop,
    };
    const exit = {
      x: end.x - dx * 0.18,
      y: end.y + liftDrop + 2,
    };
    const startVelocity = solveBallisticVelocity(start, entry, entrySeconds, gravity);
    const exitVelocity = solveBallisticVelocity(exit, end, exitSeconds, gravity);
    const guideVx = (exit.x - entry.x) / guideSeconds;
    const control1 = {
      x: entry.x + guideVx * guideSeconds * 0.28,
      y: entry.y + Math.min(8, Math.abs(guideVx) * 0.035),
    };
    const control2 = {
      x: exit.x - exitVelocity.x * guideSeconds / 3,
      y: exit.y - exitVelocity.y * guideSeconds / 3,
    };
    // Keep the support predominantly horizontal even when the ballistic exit
    // asks for a strong upward tangent near its end.
    control2.x = direction > 0
      ? clamp(control2.x, control1.x + 8, exit.x - 8)
      : clamp(control2.x, exit.x + 8, control1.x - 8);
    return cacheGuideGeometry(cacheKey, {
      entryT,
      exitT,
      entry,
      control1,
      control2,
      exit,
      startVelocity,
      exitVelocity,
      gravity,
      waveAmplitude: 0,
      waveCount: 0,
      waveDirection: 1,
    });
  }

  const direction = start.x <= 360 ? 1 : -1;
  const entrySideOffset = Math.min(28, 14 + guideSeconds * 10);
  const exitSideOffset = Math.min(14, 7 + guideSeconds * 5);
  const entry = {
    x: start.x + direction * entrySideOffset,
    y: start.y + 8,
  };
  const exit = {
    x: end.x - direction * exitSideOffset,
    y: end.y - 28,
  };
  const startVelocity = solveBallisticVelocity(start, entry, entrySeconds, gravity);
  const exitVelocity = solveBallisticVelocity(exit, end, exitSeconds, gravity);
  const averageDownwardSpeed = (exit.y - entry.y) / guideSeconds;
  const control1 = {
    x: entry.x + direction * Math.min(42, 16 + guideSeconds * 9),
    y: entry.y + Math.max(28, averageDownwardSpeed * guideSeconds * 0.3),
  };
  const control2 = {
    x: exit.x - exitVelocity.x * guideSeconds / 3,
    y: exit.y - exitVelocity.y * guideSeconds / 3,
  };
  const maxSideBend = 64;
  control2.x = clamp(control2.x, end.x - maxSideBend, end.x + maxSideBend);
  const waveCount = clamp(Math.max(2, Math.ceil(guideSeconds / 0.6)), 2, 6);
  const baseGeometry: WallScoreLongRouteGuideGeometry = {
    entryT,
    exitT,
    entry,
    control1,
    control2,
    exit,
    startVelocity,
    exitVelocity,
    gravity,
    waveAmplitude: 0,
    waveCount,
    waveDirection: direction,
  };
  // The MIDI gap determines how much *path* the pipe must provide at a natural
  // rolling speed. Longer rests therefore add bends instead of asking the ball
  // to creep through the same short vertical tube.
  const targetGuideLength = WALL_SCORE_VERTICAL_PIPE_SPEED * guideSeconds;
  return cacheGuideGeometry(cacheKey, {
    ...baseGeometry,
    waveAmplitude: solvePipeWaveAmplitude(baseGeometry, targetGuideLength),
  });
}

function routePointFromGeometry(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  phase: number,
  geometry: WallScoreLongRouteGuideGeometry,
) {
  const p = clamp(phase);
  const seconds = Math.max(0.001, spanMs / 1_000);
  if (p <= geometry.entryT) {
    const elapsed = seconds * p;
    return {
      x: start.x + geometry.startVelocity.x * elapsed,
      y: start.y + geometry.startVelocity.y * elapsed + 0.5 * geometry.gravity * elapsed ** 2,
    };
  }
  if (p < geometry.exitT) {
    const guidePhase = (p - geometry.entryT) / Math.max(0.001, geometry.exitT - geometry.entryT);
    return constantSpeedGuidePoint(geometry, guidePhase);
  }
  const elapsed = seconds * (p - geometry.exitT);
  return {
    x: geometry.exit.x + geometry.exitVelocity.x * elapsed,
    y: geometry.exit.y + geometry.exitVelocity.y * elapsed + 0.5 * geometry.gravity * elapsed ** 2,
  };
}

export function wallScoreLongRouteMotion(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  kind: WallScoreLongRouteKind,
): WallScoreLongRouteMotion {
  const geometry = wallScoreLongRouteGuideGeometry(start, end, spanMs, kind);
  const seconds = Math.max(0.001, spanMs / 1_000);
  const exitFlightSeconds = seconds * (1 - geometry.exitT);
  let pathLength = 0;
  let previous = start;
  for (let index = 1; index <= 28; index += 1) {
    const point = routePointFromGeometry(start, end, spanMs, index / 28, geometry);
    pathLength += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }
  return {
    kind,
    pathLength,
    gravity: geometry.gravity,
    startVelocity: { ...geometry.startVelocity },
    endVelocity: {
      x: geometry.exitVelocity.x,
      y: geometry.exitVelocity.y + geometry.gravity * exitFlightSeconds,
    },
  };
}

export function wallScoreLongRoutePoint(
  start: WallScoreMotionPoint,
  end: WallScoreMotionPoint,
  spanMs: number,
  phase: number,
  kind: WallScoreLongRouteKind,
) {
  const geometry = wallScoreLongRouteGuideGeometry(start, end, spanMs, kind);
  return routePointFromGeometry(start, end, spanMs, phase, geometry);
}
