import type { Frame } from "@/lib/algorithms";

/** Reference short: 30 FPS, ~12 frames per comparison beat, 8 frames for the swap itself. */
const REFERENCE_FPS = 30;
const REFERENCE_OPERATION_FRAMES = 12;
const REFERENCE_SWAP_FRAMES = 8;

export const ALGORITHM_3D_OPERATION_SECONDS = REFERENCE_OPERATION_FRAMES / REFERENCE_FPS;
export const CRANE_SWAP_SECONDS = REFERENCE_SWAP_FRAMES / REFERENCE_FPS;
export const PRE_SWAP_COMPARE_SECONDS = ALGORITHM_3D_OPERATION_SECONDS - CRANE_SWAP_SECONDS;
export const RHYTHMIC_SWAP_CUE_PROGRESS = 0.55;
export const ALGORITHM_3D_FINAL_HOLD_SECONDS = 1.1;

export function isAlgorithm3DSortComplete(frame: Frame | null | undefined) {
  return Boolean(frame && frame.arr.length > 0 && frame.sorted.length >= frame.arr.length);
}

export function getAlgorithm3DFrameSeconds(
  frame: Frame | null | undefined,
  nextFrame?: Frame | null,
) {
  if (!frame) return 0.12;
  if (frame.event === "compare") {
    return isFollowingAnimatedSwap(frame, nextFrame)
      ? PRE_SWAP_COMPARE_SECONDS
      : ALGORITHM_3D_OPERATION_SECONDS;
  }
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

function isFollowingAnimatedSwap(frame: Frame, nextFrame: Frame | null | undefined) {
  if (!nextFrame || nextFrame.event !== "swap" || nextFrame.swap.length !== 2) return false;
  const [a, b] = nextFrame.swap;
  if (a < 0 || b < 0 || a >= frame.arr.length || b >= frame.arr.length) return false;
  if (nextFrame.arr.length !== frame.arr.length) return false;
  return frame.arr[a] === nextFrame.arr[b] && frame.arr[b] === nextFrame.arr[a];
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
