import * as THREE from "three";
import { CHORD_GAP_MS } from "../engine/denseInstrumentRuns";
import type { NoteEvent, StudioSettings } from "../types";

export const RHYTHMIC_CAMERA_Z = 10.15;
export const RHYTHMIC_CAMERA_FOV = 37;
export const RHYTHMIC_UI_UPDATE_MS = 64;

export function firstEventAtOrAfter(events: NoteEvent[], timeMs: number) {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (events[mid].timeMs < timeMs) low = mid + 1;
    else high = mid;
  }
  return low;
}

export function noteDensity(events: NoteEvent[], timeMs: number, windowMs = 900) {
  const start = firstEventAtOrAfter(events, timeMs);
  let strikes = 0;
  let previousStrikeMs = Number.NEGATIVE_INFINITY;
  for (let index = start; index < events.length && events[index].timeMs <= timeMs + windowMs; index += 1) {
    if (events[index].timeMs - previousStrikeMs > CHORD_GAP_MS) {
      strikes += 1;
      previousStrikeMs = events[index].timeMs;
      if (strikes >= 16) break;
    }
  }
  return strikes / Math.max(1, windowMs / 1000);
}

export function platformImpactStrength(ageMs: number, settings: StudioSettings) {
  if (!settings.impactPlatformLight || ageMs < 0 || ageMs > 260) return 0;
  const t = 1 - ageMs / 260;
  const sensitivity = THREE.MathUtils.clamp(settings.animationSensitivity, 0, 1.5);
  return t * t * (0.8 + sensitivity * 0.35);
}

export function cameraLookAheadMs(settings: StudioSettings) {
  const base = settings.cameraProfile === "comet" ? 560
    : settings.cameraProfile === "xylophone" ? 460
      : settings.cameraProfile === "tube-board" ? 380
        : 420;
  return base * THREE.MathUtils.clamp(settings.cameraLookAhead, 0.5, 1.5);
}
