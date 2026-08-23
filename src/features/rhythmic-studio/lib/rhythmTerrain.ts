import type { StudioSettings } from "../types";

export type RhythmTerrainKind = "burst" | "steady" | "open" | "rest";

export interface RhythmTerrainStep {
  kind: RhythmTerrainKind;
  verticalDrop: number;
  horizontalDistance: number;
  bounceHeight: number;
  curveScale: number;
  platformScale: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

export const BURST_GAP_MS = 340;
export const STEADY_GAP_MS = 820;
export const REST_GAP_MS = 1500;

export function rhythmTerrainForGap(spanMs: number, settings: StudioSettings): RhythmTerrainStep {
  const span = Math.max(1, spanMs);
  const baseDrop = settings.platformGap;
  const baseBounce = settings.bounceHeight;
  const minJump = Math.max(36, settings.minBounceDistance);

  if (span >= REST_GAP_MS) {
    const t = clamp((span - REST_GAP_MS) / 1800, 0, 1);
    return {
      kind: "rest",
      verticalDrop: clamp(baseDrop * lerp(1.9, 3.25, t), 285, 560),
      horizontalDistance: clamp(lerp(minJump * 0.72, minJump * 1.05, t), 48, 108),
      bounceHeight: clamp(baseBounce * 0.42, 42, 86),
      curveScale: 0.18,
      platformScale: 1.04,
    };
  }

  if (span <= BURST_GAP_MS) {
    const t = clamp(span / BURST_GAP_MS, 0, 1);
    return {
      kind: "burst",
      verticalDrop: clamp(baseDrop * lerp(0.26, 0.5, t), 36, 82),
      horizontalDistance: clamp(lerp(minJump * 0.95, minJump * 1.45, t), 44, 108),
      bounceHeight: clamp(baseBounce * lerp(0.34, 0.58, t), 36, 82),
      curveScale: 0.34,
      platformScale: 0.9,
    };
  }

  if (span <= STEADY_GAP_MS) {
    const t = (span - BURST_GAP_MS) / (STEADY_GAP_MS - BURST_GAP_MS);
    return {
      kind: "steady",
      verticalDrop: clamp(baseDrop * lerp(0.55, 1.12, t), 82, 188),
      horizontalDistance: clamp(lerp(Math.max(88, minJump * 1.4), Math.max(164, minJump * 2.1), t), 82, 196),
      bounceHeight: clamp(baseBounce * lerp(0.64, 1.02, t), 68, 142),
      curveScale: lerp(0.48, 0.74, t),
      platformScale: lerp(0.94, 1.02, t),
    };
  }

  const t = (span - STEADY_GAP_MS) / (REST_GAP_MS - STEADY_GAP_MS);
  return {
    kind: "open",
    verticalDrop: clamp(baseDrop * lerp(1.2, 1.82, t), 176, 298),
    horizontalDistance: clamp(lerp(Math.max(168, minJump * 2.1), Math.max(255, minJump * 2.8), t), 158, 286),
    bounceHeight: clamp(baseBounce * lerp(1.02, 1.34, t), 112, 178),
    curveScale: lerp(0.78, 1.04, t),
    platformScale: lerp(1.02, 1.08, t),
  };
}

export function ballisticArcOffset(t: number, height: number) {
  const phase = clamp(t, 0, 1);
  return 4 * height * phase * (1 - phase);
}
