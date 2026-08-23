import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import { REST_GAP_MS, ballisticArcOffset, rhythmTerrainForGap } from "./rhythmTerrain";
import { guidedCoursePoint, overrideForSegment } from "./courseGuide";

export interface MarblePlatform {
  index: number;
  x: number;
  y: number;
  width: number;
  thickness: number;
  tiltRad: number;
  color: string;
  event: NoteEvent;
}

export const LONG_GAP_TUBE_MS = REST_GAP_MS;
export const TUBE_ENTRY_T = 0.18;
export const TUBE_EXIT_T = 0.82;

export interface LongGapTubeGeometry {
  entryX: number;
  entryY: number;
  control1X: number;
  control1Y: number;
  control2X: number;
  control2Y: number;
  waveAmplitude: number;
  waveDirection: number;
  exitX: number;
  exitY: number;
}

export function longGapTubeGeometry(start: MarblePlatform, end: MarblePlatform, settings: StudioSettings): LongGapTubeGeometry {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const entryX = start.x + dx * TUBE_ENTRY_T;
  const entryY = start.y + dy * TUBE_ENTRY_T - settings.ballSize - 22;
  const exitX = start.x + dx * TUBE_EXIT_T;
  const exitY = start.y + dy * TUBE_EXIT_T - settings.ballSize - 22;
  const tubeDy = exitY - entryY;
  const direction = seededNoise(start.index + 311) >= 0 ? 1 : -1;
  const lateral = clamp(Math.abs(tubeDy) * 0.14, 42, 72);
  const waveAmplitude = clamp(Math.abs(tubeDy) * 0.22, 48, 90);
  const control1X = clamp(entryX + (exitX - entryX) * 0.28 + direction * lateral, 72, 648);
  const control2X = clamp(entryX + (exitX - entryX) * 0.72 - direction * lateral * 0.92, 72, 648);
  return {
    entryX,
    entryY,
    control1X,
    control1Y: entryY + tubeDy * 0.26,
    control2X,
    control2Y: entryY + tubeDy * 0.74,
    waveAmplitude,
    waveDirection: direction,
    exitX,
    exitY,
  };
}

export function longGapTubePoint(geometry: LongGapTubeGeometry, t: number) {
  const p = clamp(t);
  const inv = 1 - p;
  const a = inv * inv * inv;
  const b = 3 * inv * inv * p;
  const c = 3 * inv * p * p;
  const d = p * p * p;
  const baseX = a * geometry.entryX + b * geometry.control1X + c * geometry.control2X + d * geometry.exitX;
  const wave = Math.sin(p * Math.PI * 2) * Math.sin(p * Math.PI) * geometry.waveAmplitude * geometry.waveDirection;
  return {
    x: clamp(baseX + wave, 54, 666),
    y: a * geometry.entryY + b * geometry.control1Y + c * geometry.control2Y + d * geometry.exitY,
  };
}

export interface MarblePoint {
  x: number;
  y: number;
  color: string;
  platformIndex: number;
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const parsed = Number.parseInt(value, 16);
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 };
}

export function mixHex(a: string, b: string, t: number) {
  const aa = hexToRgb(a);
  const bb = hexToRgb(b);
  const channel = (start: number, end: number) => Math.round(start + (end - start) * clamp(t)).toString(16).padStart(2, "0");
  return `#${channel(aa.r, bb.r)}${channel(aa.g, bb.g)}${channel(aa.b, bb.b)}`;
}

function rainbowHex(index: number, pitch: number) {
  const hue = (188 + index * 34 + pitch * 72) % 360;
  const c = 0.82;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = 0.92 - c;
  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb.map((value) => Math.round((value + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function ease(value: number, settings: StudioSettings) {
  const t = clamp(value);
  if (!settings.decoupleBallSpeed || settings.accelerationMode === "none") return t;
  const rate = Math.max(0.35, settings.accelerationRate);
  const factor = clamp(settings.accelerationFactor, settings.minSpeedCap, settings.maxSpeedCap);
  if (settings.accelerationMode === "ease-in") return clamp(Math.pow(t, rate) * factor / Math.max(1, factor));
  if (settings.accelerationMode === "ease-out") return 1 - Math.pow(1 - t, rate);
  return clamp(t + Math.sin(t * Math.PI) * 0.08 * factor);
}

function seededNoise(index: number) {
  const raw = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

export function buildMarbleCourse(events: NoteEvent[], settings: StudioSettings, width: number): MarblePlatform[] {
  if (!events.length) return [];
  const minMidi = Math.min(...events.map((event) => event.midi));
  const maxMidi = Math.max(...events.map((event) => event.midi));
  const center = width / 2;
  const laneHalf = Math.min(width * 0.39, settings.laneSpread / 2);
  let previousX = center;
  let currentY = 230;
  let direction = seededNoise(events.length + 41) >= 0 ? 1 : -1;

  return events.map((event, index) => {
    const span = index > 0 ? Math.max(1, event.timeMs - events[index - 1].timeMs) : 0;
    const terrain = rhythmTerrainForGap(span || 420, settings);
    if (index > 0) currentY += terrain.verticalDrop;

    const pitch = maxMidi === minMidi ? 0.5 : (event.midi - minMidi) / (maxMidi - minMidi);
    const platformWidth = settings.platformWidth * (0.88 + event.velocity * 0.18) * terrain.platformScale;
    const margin = Math.min(width / 2 - 24, platformWidth / 2 + 22);
    const pitchBias = (pitch - 0.5) * laneHalf * (terrain.kind === "burst" ? 0.12 : 0.22);
    const noise = seededNoise(index + 17) * terrain.horizontalDistance * 0.1;

    let x = index === 0 ? center + pitchBias * 0.35 : previousX + direction * terrain.horizontalDistance + pitchBias + noise;
    if (terrain.kind === "rest") x = previousX + direction * terrain.horizontalDistance * 0.55 + pitchBias * 0.24;

    if (x < margin || x > width - margin) {
      direction *= -1;
      x = previousX + direction * terrain.horizontalDistance + pitchBias * 0.35;
    }
    x = clamp(x, margin, width - margin);

    if (index > 0 && terrain.kind !== "rest") {
      const actualDistance = Math.abs(x - previousX);
      const minimum = Math.min(terrain.horizontalDistance * 0.58, laneHalf * 0.72);
      if (actualDistance < minimum) {
        x = clamp(previousX + direction * minimum, margin, width - margin);
      }
    }

    if (index > 0 && terrain.kind !== "burst" && seededNoise(index + 97) > 0.76) direction *= -1;
    previousX = x;
    const color = settings.colorPaletteMode === "rainbow"
      ? rainbowHex(index, pitch)
      : mixHex(settings.prismStart, settings.prismEnd, clamp(pitch * 0.74 + (index % 5) * 0.052));
    const tiltDirection = direction * -1;
    return {
      index,
      x,
      y: currentY,
      width: platformWidth,
      thickness: settings.platformThickness,
      tiltRad: (tiltDirection * settings.platformTilt * 0.24 + seededNoise(index + 7) * settings.platformTilt * 0.28) * Math.PI / 180,
      color,
      event,
    };
  });
}

export function marbleAtTime(timeMs: number, events: NoteEvent[], platforms: MarblePlatform[], settings: StudioSettings, overrides: CourseItemOverride[] = []): MarblePoint {
  if (!events.length || !platforms.length) {
    return { x: 360, y: 180, color: settings.prismStart, platformIndex: 0 };
  }

  const first = platforms[0];
  if (timeMs < events[0].timeMs) {
    const span = Math.max(280, events[0].timeMs || 620);
    const t = ease(timeMs / span, settings);
    return {
      x: first.x,
      y: first.y - settings.ballSize - settings.bounceHeight * (1 - t),
      color: first.color,
      platformIndex: 0,
    };
  }

  let index = events.length - 1;
  for (let i = 0; i < events.length - 1; i += 1) {
    if (timeMs >= events[i].timeMs && timeMs <= events[i + 1].timeMs) {
      index = i;
      break;
    }
  }
  if (index >= events.length - 1) {
    const last = platforms[platforms.length - 1];
    return { x: last.x, y: last.y - settings.ballSize, color: last.color, platformIndex: last.index };
  }

  const start = platforms[index];
  const end = platforms[index + 1];
  const span = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  const t = ease((timeMs - events[index].timeMs) / span, settings);
  const segmentOverride = overrideForSegment(index, overrides);
  if (segmentOverride) {
    const guided = guidedCoursePoint(start, end, t, segmentOverride.style, settings);
    if (guided) return { x: guided.x, y: guided.y, color: mixHex(start.color, end.color, t), platformIndex: index };
  }
  if (span >= LONG_GAP_TUBE_MS) {
    const { entryX, entryY, exitX, exitY } = longGapTubeGeometry(start, end, settings);
    if (t < TUBE_ENTRY_T) {
      const phase = t / TUBE_ENTRY_T;
      return {
        x: start.x + (entryX - start.x) * phase,
        y: start.y - settings.ballSize + (entryY - (start.y - settings.ballSize)) * phase - Math.sin(Math.PI * phase) * settings.bounceHeight * 0.42,
        color: mixHex(start.color, end.color, t),
        platformIndex: index,
      };
    }
    if (t <= TUBE_EXIT_T) {
      const phase = (t - TUBE_ENTRY_T) / (TUBE_EXIT_T - TUBE_ENTRY_T);
      const point = longGapTubePoint(longGapTubeGeometry(start, end, settings), phase);
      return {
        x: point.x,
        y: point.y,
        color: mixHex(start.color, end.color, t),
        platformIndex: index,
      };
    }
    const phase = (t - TUBE_EXIT_T) / (1 - TUBE_EXIT_T);
    return {
      x: exitX + (end.x - exitX) * phase,
      y: exitY + (end.y - settings.ballSize - exitY) * phase - Math.sin(Math.PI * phase) * settings.bounceHeight * 0.22,
      color: mixHex(start.color, end.color, t),
      platformIndex: index,
    };
  }

  const terrain = rhythmTerrainForGap(span, settings);
  const drop = end.y - start.y;
  const minimumBallisticHeight = drop * 0.28;
  const bounceHeight = Math.max(terrain.bounceHeight, minimumBallisticHeight);
  const arc = ballisticArcOffset(t, bounceHeight);
  const curveSign = end.x >= start.x ? 1 : -1;
  const horizontalCurve = 4 * t * (1 - t) * settings.curveIntensity * settings.curvePathLength * 32 * terrain.curveScale * curveSign;
  return {
    x: start.x + (end.x - start.x) * t + horizontalCurve,
    y: start.y + (end.y - start.y) * t - arc - settings.ballSize,
    color: mixHex(start.color, end.color, t),
    platformIndex: index,
  };
}

export function collisionStrength(timeMs: number, events: NoteEvent[], windowMs = 170) {
  let nearest = Infinity;
  for (const event of events) nearest = Math.min(nearest, Math.abs(timeMs - event.timeMs));
  return clamp(1 - nearest / windowMs);
}
