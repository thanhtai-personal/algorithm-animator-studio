import type { NoteEvent, StudioSettings } from "../types";

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

export const LONG_GAP_TUBE_MS = 1500;
export const TUBE_ENTRY_T = 0.22;
export const TUBE_EXIT_T = 0.78;


export interface LongGapTubeGeometry {
  entryX: number;
  entryY: number;
  exitX: number;
  exitY: number;
}

export function longGapTubeGeometry(start: MarblePlatform, end: MarblePlatform, settings: StudioSettings): LongGapTubeGeometry {
  return {
    entryX: start.x + (end.x - start.x) * 0.2,
    entryY: start.y + (end.y - start.y) * TUBE_ENTRY_T - settings.ballSize - 22,
    exitX: start.x + (end.x - start.x) * 0.8,
    exitY: start.y + (end.y - start.y) * TUBE_EXIT_T - settings.ballSize - 22,
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

  return events.map((event, index) => {
    if (index > 0) {
      const deltaMs = Math.max(1, event.timeMs - events[index - 1].timeMs);
      const gapScale = settings.autoSyncGaps ? clamp(deltaMs / 420, 0.62, 2.55) : 1;
      currentY += settings.platformGap * gapScale;
    }
    const pitch = maxMidi === minMidi ? 0.5 : (event.midi - minMidi) / (maxMidi - minMidi);
    const platformWidth = settings.platformWidth * (0.88 + event.velocity * 0.18);
    const margin = Math.min(width / 2 - 24, platformWidth / 2 + 22);
    const pitchX = center + (pitch - 0.5) * laneHalf * 1.7;
    const wobble = seededNoise(index) * laneHalf * 0.34;
    const deltaMs = index > 0 ? Math.max(1, event.timeMs - events[index - 1].timeMs) : 0;
    let x = clamp(pitchX + wobble, margin, width - margin);
    if (deltaMs > 1200) x = clamp(previousX + (pitchX - previousX) * 0.18, margin, width - margin);
    const minDistance = Math.min(settings.minBounceDistance, laneHalf * 0.7);
    if (index > 0 && Math.abs(x - previousX) < minDistance) {
      const direction = seededNoise(index + 91) >= 0 ? 1 : -1;
      x = clamp(previousX + direction * minDistance, margin, width - margin);
    }
    previousX = x;
    const color = mixHex(settings.prismStart, settings.prismEnd, clamp(pitch * 0.74 + (index % 5) * 0.052));
    return {
      index,
      x,
      y: currentY,
      width: platformWidth,
      thickness: settings.platformThickness,
      tiltRad: (seededNoise(index + 7) * settings.platformTilt * Math.PI) / 180,
      color,
      event,
    };
  });
}

export function marbleAtTime(timeMs: number, events: NoteEvent[], platforms: MarblePlatform[], settings: StudioSettings): MarblePoint {
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
      const dx = exitX - entryX;
      const dy = exitY - entryY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const wobble = Math.sin(phase * Math.PI * 2) * Math.min(5, settings.ballSize * 0.22);
      return {
        x: entryX + dx * phase + (-dy / length) * wobble,
        y: entryY + dy * phase + (dx / length) * wobble,
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

  const arc = Math.sin(Math.PI * t);
  const horizontalCurve = Math.sin(Math.PI * t) * settings.curveIntensity * settings.curvePathLength * 52 * (index % 2 ? -1 : 1);
  const speedArc = clamp(span / 520, 0.62, 1.3);
  return {
    x: start.x + (end.x - start.x) * t + horizontalCurve,
    y: start.y + (end.y - start.y) * t - arc * settings.bounceHeight * speedArc - settings.ballSize,
    color: mixHex(start.color, end.color, t),
    platformIndex: index,
  };
}

export function collisionStrength(timeMs: number, events: NoteEvent[], windowMs = 170) {
  let nearest = Infinity;
  for (const event of events) nearest = Math.min(nearest, Math.abs(timeMs - event.timeMs));
  return clamp(1 - nearest / windowMs);
}
