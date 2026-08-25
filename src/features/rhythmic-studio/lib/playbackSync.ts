import type { ExportFps, RhythmicRendererMode } from "../types";

interface RhythmicPresentationTiming {
  rendererMode: RhythmicRendererMode;
  recording: boolean;
  exportFps: ExportFps;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Audio is heard as soon as Web Audio reaches its start time, while a collision
 * submitted by Canvas/WebGL is visible only after the next paint/composite.
 * Preview therefore needs roughly one presentation frame of compensation.
 * Canvas capture is faster: half a target frame plus a small capture allowance
 * keeps the recorded audio close to the timestamp of the newly painted frame.
 */
export function rhythmicAudioPresentationDelayMs(timing: RhythmicPresentationTiming) {
  if (!timing.recording) return timing.rendererMode === "two" ? 30 : 24;
  const halfFrameMs = 500 / Math.max(1, timing.exportFps);
  return Math.round(clamp(halfFrameMs + 4, 8, 20));
}

export function rhythmicAudioStartTime(currentTimeSeconds: number, delayMs: number, minimumDelayMs = 0) {
  return currentTimeSeconds + Math.max(0, minimumDelayMs, delayMs) / 1000;
}
