import type { Frame } from "@/lib/algorithms";

export const CRANE_SWAP_SECONDS = 0.98;

export const CRANE_AUDIO_CUES = {
  approach: 0.015,
  hook: 0.245,
  lift: 0.325,
  transport: 0.445,
  lower: 0.705,
  return: 0.865,
} as const;

export function getAlgorithm3DFrameSeconds(frame: Frame | null | undefined) {
  if (!frame) return 0.12;
  if (frame.event === "compare") return 0.18;
  if (frame.event === "visit") return 0.16;
  if (frame.event === "found") return 0.22;
  if (frame.event === "swap") return CRANE_SWAP_SECONDS;
  return 0.105;
}

export function getAlgorithm3DStoryFrameSeconds(frame: Frame | null | undefined) {
  if (!frame) return 0.18;
  if (frame.event === "compare") return 0.40;
  if (frame.event === "visit") return 0.28;
  if (frame.event === "found") return 0.46;
  if (frame.event === "swap") return CRANE_SWAP_SECONDS;
  return 0.15;
}

/** Gentle reveal used by compare/visit markers. It fades in, then holds instead of strobing. */
export function selectionReveal3D(progress: number) {
  const t = clamp01(progress / 0.34);
  return t * t * (3 - 2 * t);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
