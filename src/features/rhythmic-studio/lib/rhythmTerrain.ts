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

function scaledStep(
  kind: RhythmTerrainKind,
  settings: StudioSettings,
  verticalDrop: number,
  horizontalDistance: number,
  bounceHeight: number,
  curveScale: number,
  platformScale: number,
): RhythmTerrainStep {
  const scale = controlScales(settings);
  return {
    kind,
    verticalDrop: clamp(verticalDrop * scale.vertical, 24, 760),
    horizontalDistance: clamp(horizontalDistance * scale.horizontal, 24, 330),
    bounceHeight: clamp(bounceHeight * scale.bounce, 24, 300),
    curveScale,
    platformScale,
  };
}

export function rhythmTerrainForGap(spanMs: number, settings: StudioSettings): RhythmTerrainStep {
  const span = Math.max(1, spanMs);
  if (span >= REST_GAP_MS) {
    const t = clamp((span - REST_GAP_MS) / 1800, 0, 1);
    return scaledStep("rest", settings, lerp(310, 520, t), lerp(58, 92, t), lerp(54, 82, t), 0.18, 1.04);
  }

  if (span <= BURST_GAP_MS) {
    const t = clamp(span / BURST_GAP_MS, 0, 1);
    return scaledStep("burst", settings, lerp(44, 78, t), lerp(50, 92, t), lerp(46, 74, t), 0.34, 0.9);
  }

  if (span <= STEADY_GAP_MS) {
    const t = (span - BURST_GAP_MS) / (STEADY_GAP_MS - BURST_GAP_MS);
    return scaledStep("steady", settings, lerp(88, 182, t), lerp(94, 184, t), lerp(76, 132, t), lerp(0.48, 0.74, t), lerp(0.94, 1.02, t));
  }

  const t = (span - STEADY_GAP_MS) / (REST_GAP_MS - STEADY_GAP_MS);
  return scaledStep("open", settings, lerp(190, 300, t), lerp(176, 276, t), lerp(132, 174, t), lerp(0.78, 1.04, t), lerp(1.02, 1.08, t));
}

export function ballisticArcOffset(t: number, height: number) {
  const phase = clamp(t, 0, 1);
  return 4 * height * phase * (1 - phase);
}
