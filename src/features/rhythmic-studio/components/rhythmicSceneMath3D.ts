import * as THREE from "three";
import { CHORD_GAP_MS } from "../engine/denseInstrumentRuns";
import type { NoteEvent, StudioSettings } from "../types";

export const RHYTHMIC_CAMERA_Z = 10.15;
export const RHYTHMIC_CAMERA_FOV = 37;
export const RHYTHMIC_UI_UPDATE_MS = 64;

type Point3D = { x: number; y: number; z: number };

export const SHOWCASE_SHADOW_LIGHT_OFFSET = { x: -2.4, y: 3.2, z: 14 } as const;
export const RHYTHMIC_SHADOW_RECEIVER_Z = -4.02;
export const RHYTHMIC_SHOWCASE_WALL_CENTER_Y = -270;
export const RHYTHMIC_SHOWCASE_WALL_HEIGHT = 560;

export function wallMountProfile(frontDepth: number) {
  const anchorThickness = 0.08;
  // All values are local to the instrument group, whose origin sits at
  // -frontDepth. The anchor face and the shadow catcher therefore resolve to
  // the exact same world-space plane for every instrument body depth.
  const anchorZ = RHYTHMIC_SHADOW_RECEIVER_Z + frontDepth;
  const anchorCenterZ = anchorZ + anchorThickness * 0.5;
  const stemStartZ = -Math.max(0.08, frontDepth * 1.02);
  const stemEndZ = anchorZ + anchorThickness;
  return {
    anchorZ,
    anchorCenterZ,
    anchorThickness,
    stemCenterZ: (stemStartZ + stemEndZ) * 0.5,
    stemLength: Math.abs(stemStartZ - stemEndZ),
  };
}

export function shadowReceiverOffset(receiverDepth: number, lightOffset: Point3D) {
  const depthScale = receiverDepth / Math.max(0.001, Math.abs(lightOffset.z));
  return {
    x: -lightOffset.x * depthScale,
    y: -lightOffset.y * depthScale,
  };
}

export function shadowRigPose(focus: Point3D, offset: Point3D) {
  return {
    target: { x: focus.x, y: focus.y, z: focus.z },
    light: {
      x: focus.x + offset.x,
      y: focus.y + offset.y,
      z: focus.z + offset.z,
    },
  };
}

export function cameraDepthProfile(settings: StudioSettings) {
  if (settings.instrumentFamily !== "auto") return { offset: -1.75, near: 7.6, far: 10.2 };
  if (settings.cameraProfile === "xylophone") return { offset: -0.6, near: 8.4, far: 11.2 };
  if (settings.cameraProfile === "tube-board") return { offset: -0.25, near: 8.4, far: 11.5 };
  if (settings.cameraProfile === "comet") return { offset: 0.15, near: 9.2, far: 12.5 };
  return { offset: -0.1, near: 8.8, far: 12 };
}

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
