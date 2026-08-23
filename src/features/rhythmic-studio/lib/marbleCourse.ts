import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import { REST_GAP_MS } from "./rhythmTerrain";
import { guidedCoursePoint, overrideForSegment } from "./courseGuide";
import { buildPhysicsCourse } from "../engine/marbleCoursePlanner";
import type { MarblePlatform, MarblePoint } from "../engine/marblePhysicsTypes";
import { presetObstaclePlan } from "../engine/presetObstaclePlan";
import { instrumentScenePlan } from "../engine/instrumentScenePlan";

export type { MarblePlatform, MarblePoint } from "../engine/marblePhysicsTypes";

export function platformContactPoint(platform: MarblePlatform) {
  return { x: platform.contactX ?? platform.x, y: platform.contactY ?? platform.y };
}

export function marbleHitPoint(platform: MarblePlatform) {
  if (Number.isFinite(platform.hitX) && Number.isFinite(platform.hitY)) return { x: platform.hitX, y: platform.hitY };
  const contact = platformContactPoint(platform);
  return { x: contact.x, y: contact.y };
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
  const startHit = marbleHitPoint(start);
  const endHit = marbleHitPoint(end);
  const startX = startHit.x;
  const endX = endHit.x;
  const dx = endX - startX;
  const dy = endHit.y - startHit.y;
  const entryX = startX + dx * TUBE_ENTRY_T;
  const entryY = startHit.y + dy * TUBE_ENTRY_T - 18;
  const exitX = startX + dx * TUBE_EXIT_T;
  const exitY = startHit.y + dy * TUBE_EXIT_T - 18;
  const tubeDy = exitY - entryY;
  const direction = seededNoise(start.index + 311) >= 0 ? 1 : -1;
  const lateral = clamp(Math.abs(tubeDy) * 0.14, 42, 72);
  const waveAmplitude = clamp(Math.abs(tubeDy) * 0.22, 48, 90);
  const control1X = entryX + (exitX - entryX) * 0.28 + direction * lateral;
  const control2X = entryX + (exitX - entryX) * 0.72 - direction * lateral * 0.92;
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
    x: baseX + wave,
    y: a * geometry.entryY + b * geometry.control1Y + c * geometry.control2Y + d * geometry.exitY,
  };
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

function paletteColor(index: number, pitch: number, settings: StudioSettings) {
  if (settings.colorPaletteMode === "rainbow") return rainbowHex(index, pitch);
  if (settings.colorPaletteMode === "tube-accent") {
    const accents = ["#58a9ff", "#65b8ff", "#ff3e49", "#5aaeff", "#ffd52b", "#62adff", "#32e96b", "#56a8ff"];
    return accents[index % accents.length];
  }
  if (settings.colorPaletteMode === "neon-galaxy") {
    const colors = ["#5677ff", "#5bd8ff", "#ff4fc7", "#785cff"];
    return mixHex(colors[index % colors.length], colors[(index + 1) % colors.length], 0.32 + pitch * 0.44);
  }
  if (settings.colorPaletteMode === "key-rainbow") {
    const style = presetObstaclePlan(index, settings)?.style;
    const scene = instrumentScenePlan(index);
    if (style === "instrument-cymbal") return scene.sceneId === "finale" ? "#d5d9df" : (index % 2 ? "#c89f5a" : "#e4c88f");
    if (style === "instrument-rail") return scene.sceneId === "finale" && index % 3 === 0 ? "#70e5f1" : "#737985";
    if (style === "instrument-wire") return scene.sceneId === "wires" && index % 4 === 0 ? "#69c9d7" : "#7a808a";
    if (style === "instrument-pad") {
      const pads = scene.sceneId === "bars"
        ? ["#30333a", "#4a4d55", "#e9edf1", "#202329"]
        : ["#ff4fa6", "#ff5b76", "#42dfba", "#f8f8f5", "#2f333c"];
      return pads[index % pads.length];
    }
    const colors = ["#ff4f59", "#ff9238", "#ffdb45", "#62e572", "#4bdcff", "#5f86ff", "#cf6dff"];
    return colors[index % colors.length];
  }
  return mixHex(settings.prismStart, settings.prismEnd, clamp(pitch * 0.74 + (index % 5) * 0.052));
}

function platformAngle(index: number, direction: number, settings: StudioSettings) {
  if (settings.terrainProfile === "tube-board") {
    const sign = seededNoise(index + 301) >= 0 ? 1 : -1;
    return sign * (56 + Math.abs(seededNoise(index + 37)) * 27) * Math.PI / 180;
  }
  if (settings.terrainProfile === "xylophone") return seededNoise(index + 7) * 1.4 * Math.PI / 180;
  const tiltDirection = direction === 0 ? (index % 2 === 0 ? 1 : -1) : direction * -1;
  return (tiltDirection * settings.platformTilt * 0.24 + seededNoise(index + 7) * settings.platformTilt * 0.2) * Math.PI / 180;
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
  return buildPhysicsCourse(events, settings, width, (index, pitch) => paletteColor(index, pitch, settings));
}

export function marbleAtTime(timeMs: number, events: NoteEvent[], platforms: MarblePlatform[], settings: StudioSettings, overrides: CourseItemOverride[] = []): MarblePoint {
  if (!events.length || !platforms.length) return { x: 360, y: 180, color: settings.prismStart, platformIndex: 0 };

  const first = platforms[0];
  const firstHit = marbleHitPoint(first);
  if (timeMs < events[0].timeMs) {
    const span = Math.max(280, events[0].timeMs || 620);
    const t = ease(timeMs / span, settings);
    return {
      x: firstHit.x,
      y: firstHit.y - Math.max(52, settings.bounceHeight * 0.82) * (1 - t),
      color: first.color,
      platformIndex: 0,
    };
  }

  let low = 0;
  let high = events.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (events[mid].timeMs <= timeMs) low = mid;
    else high = mid - 1;
  }
  const index = low;
  if (index >= events.length - 1) {
    const last = platforms[platforms.length - 1];
    const hit = marbleHitPoint(last);
    return { x: hit.x, y: hit.y, color: last.color, platformIndex: last.index };
  }

  const start = platforms[index];
  const end = platforms[index + 1];
  const startHit = marbleHitPoint(start);
  const endHit = marbleHitPoint(end);
  const span = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  const rawT = clamp((timeMs - events[index].timeMs) / span);
  const segmentOverride = overrideForSegment(index, overrides);
  if (segmentOverride) {
    const guided = guidedCoursePoint(start, end, rawT, segmentOverride.style, settings);
    if (guided) return { x: guided.x, y: guided.y, color: mixHex(start.color, end.color, rawT), platformIndex: index };
  }

  if (span >= LONG_GAP_TUBE_MS && settings.terrainProfile !== "comet" && settings.terrainProfile !== "xylophone") {
    const geometry = longGapTubeGeometry(start, end, settings);
    if (rawT < TUBE_ENTRY_T) {
      const phase = rawT / TUBE_ENTRY_T;
      return {
        x: startHit.x + (geometry.entryX - startHit.x) * phase,
        y: startHit.y + (geometry.entryY - startHit.y) * phase - Math.sin(Math.PI * phase) * settings.bounceHeight * 0.28,
        color: mixHex(start.color, end.color, rawT),
        platformIndex: index,
      };
    }
    if (rawT <= TUBE_EXIT_T) {
      const phase = (rawT - TUBE_ENTRY_T) / (TUBE_EXIT_T - TUBE_ENTRY_T);
      const point = longGapTubePoint(geometry, phase);
      return { ...point, color: mixHex(start.color, end.color, rawT), platformIndex: index };
    }
    const phase = (rawT - TUBE_EXIT_T) / (1 - TUBE_EXIT_T);
    return {
      x: geometry.exitX + (endHit.x - geometry.exitX) * phase,
      y: geometry.exitY + (endHit.y - geometry.exitY) * phase - Math.sin(Math.PI * phase) * settings.bounceHeight * 0.16,
      color: mixHex(start.color, end.color, rawT),
      platformIndex: index,
    };
  }

  const elapsed = (timeMs - events[index].timeMs) / 1000;
  return {
    x: startHit.x + start.outVX * elapsed,
    y: startHit.y + start.outVY * elapsed + 0.5 * start.gravity * elapsed * elapsed,
    color: mixHex(start.color, end.color, rawT),
    platformIndex: index,
  };
}

export function collisionStrength(timeMs: number, events: NoteEvent[], windowMs = 170) {
  if (!events.length) return 0;
  let low = 0;
  let high = events.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (events[mid].timeMs < timeMs) low = mid + 1;
    else high = mid;
  }
  const next = low < events.length ? Math.abs(events[low].timeMs - timeMs) : Infinity;
  const previous = low > 0 ? Math.abs(events[low - 1].timeMs - timeMs) : Infinity;
  return clamp(1 - Math.min(previous, next) / windowMs);
}
