import type { StudioSettings } from "../types";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function courseWorldBounds(settings: StudioSettings, width: number) {
  if (settings.instrumentFamily !== "auto") return { min: width * 0.14, max: width * 0.86 };
  if (settings.terrainProfile === "balanced") return { min: 62, max: width - 62 };
  if (settings.terrainProfile === "xylophone") return { min: 72, max: width - 72 };
  if (settings.terrainProfile === "tube-board") return { min: 64, max: width - 64 };
  return { min: -width * 0.55, max: width * 1.55 };
}

function pointSegmentDistance(point: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < 1e-6) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function cross(a: Vec2, b: Vec2, c: Vec2) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentIntersects(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return ((abC <= 0 && abD >= 0) || (abC >= 0 && abD <= 0))
    && ((cdA <= 0 && cdB >= 0) || (cdA >= 0 && cdB <= 0));
}

function segmentDistance(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
  if (segmentIntersects(a, b, c, d)) return 0;
  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b),
  );
}

export function platformSegment(platform: MarblePlatform) {
  const x = platform.visualX ?? platform.x;
  const y = platform.visualY ?? platform.y;
  const width = platform.visualWidth ?? platform.width;
  const tiltRad = platform.visualTiltRad ?? platform.tiltRad;
  const dx = Math.cos(tiltRad) * width * 0.5;
  const dy = Math.sin(tiltRad) * width * 0.5;
  return {
    a: { x: x - dx, y: y - dy },
    b: { x: x + dx, y: y + dy },
  };
}

function sameContinuousSurface(a: MarblePlatform, b: MarblePlatform) {
  return (a.denseSurfaceId !== undefined && a.denseSurfaceId === b.denseSurfaceId)
    || (a.denseRunId !== undefined && a.denseRunId === b.denseRunId)
    || (a.chordClusterId !== undefined && a.chordClusterId === b.chordClusterId);
}

function visibleForCollision(platform: MarblePlatform) {
  return platform.visualHidden !== true;
}

export function platformRequiredClearance(platform: MarblePlatform, other: MarblePlatform, settings: StudioSettings) {
  const bodyClearance = (platform.thickness + other.thickness) * 0.52;
  const marbleClearance = settings.ballSize * (settings.instrumentFamily !== "auto" ? 1.28 : 1.08);
  return Math.max(
    settings.instrumentFamily !== "auto" ? 20 : 16,
    bodyClearance,
    marbleClearance,
  );
}

export function platformClearance(platform: MarblePlatform, other: MarblePlatform) {
  const segment = platformSegment(platform);
  const previous = platformSegment(other);
  return segmentDistance(segment.a, segment.b, previous.a, previous.b);
}

export function platformOverlapPenalty(platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  if (!visibleForCollision(platform)) return 0;
  const segment = platformSegment(platform);
  let penalty = 0;
  for (const other of recent) {
    if (!visibleForCollision(other) || sameContinuousSurface(platform, other)) continue;
    const previous = platformSegment(other);
    const distance = segmentDistance(segment.a, segment.b, previous.a, previous.b);
    const safeDistance = platformRequiredClearance(platform, other, settings);
    if (distance < safeDistance) {
      const overlap = safeDistance - distance;
      const crossingBoost = distance < 0.5 ? 12000 : 0;
      penalty += crossingBoost + overlap * 28 + overlap * overlap * 1.15;
    }
  }
  return penalty;
}

function trajectoryPoint(hit: Vec2, outgoing: Vec2, gravity: number, t: number, motionMode: MarblePlatform["motionMode"]): Vec2 {
  if (motionMode === "hold") return hit;
  if (motionMode === "roll") return { x: hit.x + outgoing.x * t, y: hit.y + outgoing.y * t };
  return {
    x: hit.x + outgoing.x * t,
    y: hit.y + outgoing.y * t + 0.5 * gravity * t * t,
  };
}

export function trajectoryClearancePenalty(
  hit: Vec2,
  outgoing: Vec2,
  spanMs: number,
  gravity: number,
  motionMode: MarblePlatform["motionMode"],
  platform: MarblePlatform,
  recent: MarblePlatform[],
  settings: StudioSettings,
) {
  if (motionMode === "hold") return 0;
  const dt = Math.max(0.08, spanMs / 1000);
  const steps = Math.max(5, Math.min(14, Math.ceil(dt * 18)));
  let penalty = 0;
  for (const other of recent) {
    if (!visibleForCollision(other) || sameContinuousSurface(platform, other)) continue;
    const obstacle = platformSegment(other);
    const clearance = Math.max(settings.ballSize * 1.02 + other.thickness * 0.5, settings.ballSize + 5);
    let previous = hit;
    let minimum = Infinity;
    for (let step = 1; step <= steps; step += 1) {
      const point = trajectoryPoint(hit, outgoing, gravity, dt * (step / steps), motionMode);
      minimum = Math.min(minimum, segmentDistance(previous, point, obstacle.a, obstacle.b));
      previous = point;
    }
    if (minimum < clearance) {
      const intrusion = clearance - minimum;
      const crossingBoost = minimum < Math.max(1.5, settings.ballSize * 0.18) ? 18000 : 0;
      penalty += crossingBoost + intrusion * 34 + intrusion * intrusion * 1.4;
    }
  }
  return penalty;
}

export function trajectoryPlatformClearance(platform: MarblePlatform, start: MarblePlatform, end: MarblePlatform) {
  const body = platformSegment(platform);
  const spanMs = Math.max(1, end.event.timeMs - start.event.timeMs);
  const dt = Math.max(0.08, spanMs / 1000);
  const steps = Math.max(5, Math.min(14, Math.ceil(dt * 18)));
  const motionMode = start.motionMode ?? "ballistic";
  if (motionMode === "hold") return Infinity;
  const outgoing = { x: start.outVX, y: start.outVY };
  const origin = { x: start.hitX, y: start.hitY };
  let previous = origin;
  let minimum = Infinity;
  for (let step = 1; step <= steps; step += 1) {
    const point = trajectoryPoint(origin, outgoing, start.gravity, dt * (step / steps), motionMode);
    minimum = Math.min(minimum, segmentDistance(previous, point, body.a, body.b));
    previous = point;
  }
  return minimum;
}

export function platformAgainstRecentTrajectoriesPenalty(platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  if (!visibleForCollision(platform) || recent.length < 2) return 0;
  const clearance = Math.max(settings.ballSize * 1.02 + platform.thickness * 0.5, settings.ballSize + 5);
  let penalty = 0;
  for (let index = 0; index < recent.length - 1; index += 1) {
    const start = recent[index];
    const end = recent[index + 1];
    if (!visibleForCollision(start) || sameContinuousSurface(platform, start) || sameContinuousSurface(platform, end)) continue;
    const minimum = trajectoryPlatformClearance(platform, start, end);
    if (minimum < clearance) {
      const intrusion = clearance - minimum;
      const crossingBoost = minimum < Math.max(1.5, settings.ballSize * 0.18) ? 16000 : 0;
      penalty += crossingBoost + intrusion * 30 + intrusion * intrusion * 1.25;
    }
  }
  return penalty;
}

export function nextImpactClearancePenalty(target: Vec2, platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  let penalty = 0;
  for (const other of recent) {
    if (!visibleForCollision(other) || sameContinuousSurface(platform, other)) continue;
    const obstacle = platformSegment(other);
    const distance = pointSegmentDistance(target, obstacle.a, obstacle.b);
    const clearance = Math.max(settings.ballSize * 1.35 + other.thickness * 0.5, settings.ballSize * 1.7);
    if (distance < clearance) {
      const intrusion = clearance - distance;
      penalty += 7000 + intrusion * 28 + intrusion * intrusion;
    }
  }
  return penalty;
}

export function wallClearancePenalty(platform: MarblePlatform, settings: StudioSettings, width: number) {
  if (settings.instrumentFamily === "auto") return 0;
  const bounds = courseWorldBounds(settings, width);
  const segment = platformSegment(platform);
  const overhang = Math.max(
    0,
    bounds.min - Math.min(segment.a.x, segment.b.x),
    Math.max(segment.a.x, segment.b.x) - bounds.max,
  );
  if (overhang <= 0) return 0;
  return 3000 + overhang * 52 + overhang * overhang * 2.1;
}

export function adjacentSpacingPenalty(target: Vec2, current: Vec2, settings: StudioSettings) {
  const profileScale = settings.instrumentFamily !== "auto" ? 0.68
    : settings.terrainProfile === "xylophone" ? 0.58
      : settings.terrainProfile === "tube-board" ? 0.54
        : settings.terrainProfile === "comet" ? 0.5
          : 0.48;
  const preferred = Math.max(settings.ballSize * 3.4, settings.platformGap * profileScale, settings.minBounceDistance);
  const distance = Math.hypot(target.x - current.x, target.y - current.y);
  if (distance >= preferred) return 0;
  const shortfall = preferred - distance;
  return shortfall * 7.5 + shortfall * shortfall * 0.11;
}

export function separationPenalty(target: Vec2, recentHits: Vec2[], settings: StudioSettings) {
  const profileScale = settings.instrumentFamily !== "auto" ? 0.6
    : settings.terrainProfile === "tube-board" ? 0.5
      : settings.terrainProfile === "xylophone" ? 0.46
        : settings.terrainProfile === "comet" ? 0.4
          : 0.42;
  const threshold = Math.max(
    settings.ballSize * 3.1,
    settings.platformThickness * 2.15,
    settings.platformGap * profileScale,
    settings.minBounceDistance * 0.85,
  );
  let penalty = 0;
  for (const point of recentHits) {
    const distance = Math.hypot(target.x - point.x, target.y - point.y);
    if (distance < threshold) {
      const overlap = threshold - distance;
      penalty += overlap * 3.8 + overlap * overlap * 0.045;
    }
  }
  return penalty;
}
