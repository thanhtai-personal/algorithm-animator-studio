import {
  WALL_SCORE_VERTICAL_PIPE_SPEED,
  type WallScoreLongRouteGuideGeometry,
  type WallScoreLongRouteKind,
  type WallScoreLongRouteMotion,
  type WallScoreMotionPoint,
} from "./wallScoreMotionTypes";

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

export function wallScoreLongRouteGuideWindow(spanMs: number, kind: WallScoreLongRouteKind) {
  const safeSpanMs = Math.max(1, spanMs);
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
    const entry = { x: start.x + dx * 0.22, y: start.y + liftDrop };
    const exit = { x: end.x - dx * 0.18, y: end.y + liftDrop + 2 };
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
  const entrySideOffset = Math.min(21, 18 + guideSeconds * 6);
  const exitSideOffset = Math.min(8, 4 + guideSeconds * 2);
  const entry = { x: start.x + direction * entrySideOffset, y: start.y + 10 };
  const exit = { x: end.x - direction * exitSideOffset, y: end.y - 28 };
  const startVelocity = solveBallisticVelocity(start, entry, entrySeconds, gravity);
  const exitVelocity = solveBallisticVelocity(exit, end, exitSeconds, gravity);
  const averageDownwardSpeed = (exit.y - entry.y) / guideSeconds;
  const control1 = {
    x: entry.x + direction * Math.min(24, 10 + guideSeconds * 6),
    y: entry.y + Math.max(28, averageDownwardSpeed * guideSeconds * 0.3),
  };
  const control2 = {
    x: exit.x - exitVelocity.x * guideSeconds / 3,
    y: exit.y - exitVelocity.y * guideSeconds / 3,
  };
  control2.x = clamp(control2.x, end.x - 28, end.x + 28);
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
