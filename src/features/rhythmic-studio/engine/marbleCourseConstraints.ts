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

function platformSegment(platform: MarblePlatform) {
  const dx = Math.cos(platform.tiltRad) * platform.width * 0.5;
  const dy = Math.sin(platform.tiltRad) * platform.width * 0.5;
  return {
    a: { x: platform.x - dx, y: platform.y - dy },
    b: { x: platform.x + dx, y: platform.y + dy },
  };
}

export function platformOverlapPenalty(platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  const collisionCritical = settings.terrainProfile === "tube-board"
    || settings.terrainProfile === "xylophone"
    || settings.instrumentFamily !== "auto";
  if (!collisionCritical) return 0;
  const segment = platformSegment(platform);
  let penalty = 0;
  for (const other of recent) {
    const previous = platformSegment(other);
    const distance = segmentDistance(segment.a, segment.b, previous.a, previous.b);
    const safeDistance = Math.max(
      settings.instrumentFamily !== "auto" ? 22 : 18,
      settings.ballSize * (settings.instrumentFamily !== "auto" ? 1.45 : 0.95),
      (platform.thickness + other.thickness) * 0.62,
    );
    if (distance < safeDistance) {
      const overlap = safeDistance - distance;
      const crossingBoost = distance < 0.5 ? 9000 : 0;
      penalty += crossingBoost + overlap * 22 + overlap * overlap * 0.8;
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
