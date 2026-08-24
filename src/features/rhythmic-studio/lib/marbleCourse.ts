import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import { REST_GAP_MS } from "./rhythmTerrain";
import { guidedCoursePoint, overrideForSegment } from "./courseGuide";
import { buildPhysicsCourse, type StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { MarblePlatform, MarblePoint } from "../engine/marblePhysicsTypes";
import { marbleEntrySpeed, marblePhysicsProfile } from "../engine/marblePhysicsProfiles";
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
    const accents = ["#6baeff", "#7cc4ff", "#ff6f5f", "#7aa4ff", "#f7cf6a", "#67a6f2", "#66d78a", "#86b5ff"];
    return accents[index % accents.length];
  }
  if (settings.colorPaletteMode === "neon-galaxy") {
    const midpoint = mixHex(settings.prismStart, settings.prismEnd, 0.5);
    const colors = [settings.prismStart, mixHex(settings.prismStart, "#ffffff", 0.22), settings.prismEnd, midpoint];
    return mixHex(colors[index % colors.length], colors[(index + 1) % colors.length], 0.32 + pitch * 0.44);
  }
  if (settings.colorPaletteMode === "key-rainbow") {
    const style = presetObstaclePlan(index, settings)?.style;
    const scene = instrumentScenePlan(index);
    if (style === "instrument-cymbal") return scene.sceneId === "finale" ? "#d5d9df" : (index % 2 ? "#c89f5a" : "#e4c88f");
    if (style === "instrument-rail") return scene.sceneId === "finale" && index % 3 === 0 ? "#70e5f1" : "#737985";
    if (style === "instrument-wire") return scene.sceneId === "runway" && index % 4 === 0 ? "#69c9d7" : "#7a808a";
    if (style === "instrument-pad") {
      const pads = scene.sceneId === "pads"
        ? ["#30333a", "#4a4d55", "#e9edf1", "#202329"]
        : ["#e9789c", "#ff8b73", "#67d8ba", "#f2efe8", "#4a4d56"];
      return pads[index % pads.length];
    }
    const colors = ["#e86a6e", "#efab58", "#d6c75e", "#78cc76", "#63c5dd", "#7c8fe6", "#b985dc"];
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

function seededNoise(index: number) {
  const raw = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

export function buildMarbleCourse(events: NoteEvent[], settings: StudioSettings, width: number, resolveSettings?: StudioSettingsResolver): MarblePlatform[] {
  return buildPhysicsCourse(
    events,
    settings,
    width,
    (index, pitch) => paletteColor(index, pitch, resolveSettings?.(index) ?? settings),
    resolveSettings,
  );
}

export function marbleAtTime(timeMs: number, events: NoteEvent[], platforms: MarblePlatform[], settings: StudioSettings, overrides: CourseItemOverride[] = [], resolveSettings?: StudioSettingsResolver): MarblePoint {
  if (!events.length || !platforms.length) return { x: 360, y: 180, color: settings.prismStart, platformIndex: 0 };

  const first = platforms[0];
  const firstHit = marbleHitPoint(first);
  if (timeMs < events[0].timeMs) {
    const initialSettings = resolveSettings?.(0) ?? settings;
    const profile = marblePhysicsProfile(initialSettings);
    const impactSpeed = marbleEntrySpeed(initialSettings);
    const fallDuration = impactSpeed / profile.gravity;
    const secondsBeforeImpact = Math.max(0, (events[0].timeMs - timeMs) / 1000);
    const elapsedSinceRelease = clamp(fallDuration - secondsBeforeImpact, 0, fallDuration);
    const releaseHeight = 0.5 * profile.gravity * fallDuration * fallDuration;
    return {
      x: firstHit.x,
      y: firstHit.y - releaseHeight + 0.5 * profile.gravity * elapsedSinceRelease * elapsedSinceRelease,
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

  const segmentSettings = resolveSettings?.(index) ?? settings;
  const start = platforms[index];
  const end = platforms[index + 1];
  const startHit = marbleHitPoint(start);
  const span = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  const rawT = clamp((timeMs - events[index].timeMs) / span);
  const segmentOverride = overrideForSegment(index, overrides);
  if (segmentOverride) {
    const guided = guidedCoursePoint(start, end, rawT, segmentOverride.style, segmentSettings);
    if (guided) return { x: guided.x, y: guided.y, color: mixHex(start.color, end.color, rawT), platformIndex: index };
  }

  if (start.motionMode === "hold") {
    return { x: startHit.x, y: startHit.y, color: mixHex(start.color, end.color, rawT), platformIndex: index };
  }

  if (start.motionMode === "roll") {
    const endHit = marbleHitPoint(end);
    // Dense passages use a continuous keyboard/pad surface. Keep the marble
    // constrained to that surface instead of forcing impossible micro-bounces.
    return {
      x: startHit.x + (endHit.x - startHit.x) * rawT,
      y: startHit.y + (endHit.y - startHit.y) * rawT,
      color: mixHex(start.color, end.color, rawT),
      platformIndex: index,
    };
  }

  // Automatic tube interpolation used to replace the real ballistic arc on long
  // gaps. That made the marble visibly change acceleration mid-flight. Long gaps
  // now remain pure gravity motion; only an explicit course override may guide it.
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
