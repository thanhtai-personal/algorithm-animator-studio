import type { StudioSettings, TerrainProfile } from "../types";

export type RhythmTerrainKind = "burst" | "steady" | "open" | "rest";

export interface RhythmTerrainStep {
  kind: RhythmTerrainKind;
  verticalDrop: number;
  horizontalDistance: number;
  bounceHeight: number;
  curveScale: number;
  platformScale: number;
}

const DEFAULT_GAP = 150;
const DEFAULT_LANE = 430;
const DEFAULT_JUMP = 42;
const DEFAULT_BOUNCE = 126;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

export const BURST_GAP_MS = 340;
export const STEADY_GAP_MS = 820;
export const REST_GAP_MS = 1500;

function controlScales(settings: StudioSettings) {
  const vertical = clamp(settings.platformGap / DEFAULT_GAP, 0.42, 2.1);
  const lane = clamp(settings.laneSpread / DEFAULT_LANE, 0.5, 1.45);
  const jump = clamp(settings.minBounceDistance / DEFAULT_JUMP, 0.35, 2.6);
  const horizontal = clamp(lane * Math.pow(jump, 0.38), 0.42, 1.75);
  const bounce = clamp(settings.bounceHeight / DEFAULT_BOUNCE, 0.35, 2.05);
  return { vertical, horizontal, bounce };
}

function baseStep(span: number): RhythmTerrainStep {
  if (span >= REST_GAP_MS) {
    const t = clamp((span - REST_GAP_MS) / 1800, 0, 1);
    return { kind: "rest", verticalDrop: lerp(310, 520, t), horizontalDistance: lerp(58, 92, t), bounceHeight: lerp(54, 82, t), curveScale: 0.18, platformScale: 1.04 };
  }
  if (span <= BURST_GAP_MS) {
    const t = clamp(span / BURST_GAP_MS, 0, 1);
    return { kind: "burst", verticalDrop: lerp(44, 78, t), horizontalDistance: lerp(50, 92, t), bounceHeight: lerp(46, 74, t), curveScale: 0.34, platformScale: 0.9 };
  }
  if (span <= STEADY_GAP_MS) {
    const t = (span - BURST_GAP_MS) / (STEADY_GAP_MS - BURST_GAP_MS);
    return { kind: "steady", verticalDrop: lerp(88, 182, t), horizontalDistance: lerp(94, 184, t), bounceHeight: lerp(76, 132, t), curveScale: lerp(0.48, 0.74, t), platformScale: lerp(0.94, 1.02, t) };
  }
  const t = (span - STEADY_GAP_MS) / (REST_GAP_MS - STEADY_GAP_MS);
  return { kind: "open", verticalDrop: lerp(190, 300, t), horizontalDistance: lerp(176, 276, t), bounceHeight: lerp(132, 174, t), curveScale: lerp(0.78, 1.04, t), platformScale: lerp(1.02, 1.08, t) };
}

function profileScale(profile: TerrainProfile) {
  if (profile === "tube-board") return { v: 1.12, h: 0.78, b: 0.72, c: 0.5 };
  if (profile === "comet") return { v: 1.02, h: 1.42, b: 1.3, c: 1.35 };
  if (profile === "xylophone") return { v: 1.28, h: 0.9, b: 0.76, c: 0.36 };
  return { v: 1, h: 1, b: 1, c: 1 };
}

export function rhythmTerrainForGap(spanMs: number, settings: StudioSettings): RhythmTerrainStep {
  const base = baseStep(Math.max(1, spanMs));
  const control = controlScales(settings);
  const profile = profileScale(settings.terrainProfile);
  return {
    kind: base.kind,
    verticalDrop: clamp(base.verticalDrop * control.vertical * profile.v, 22, 760),
    horizontalDistance: clamp(base.horizontalDistance * control.horizontal * profile.h, 14, 330),
    bounceHeight: clamp(base.bounceHeight * control.bounce * profile.b, 16, 300),
    curveScale: base.curveScale * profile.c,
    platformScale: base.platformScale,
  };
}

export function ballisticArcOffset(t: number, height: number) {
  const phase = clamp(t, 0, 1);
  return 4 * height * phase * (1 - phase);
}
