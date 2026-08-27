import * as THREE from "three";
import { CHORD_GAP_MS } from "../engine/denseInstrumentRuns";
import type { NoteEvent, StudioSettings } from "../types";

export const RHYTHMIC_CAMERA_Z = 10.15;
export const RHYTHMIC_CAMERA_FOV = 37;
export const RHYTHMIC_UI_UPDATE_MS = 96;

type Point3D = { x: number; y: number; z: number };

export const SHOWCASE_SHADOW_LIGHT_OFFSET = { x: -2.4, y: 3.2, z: 14 } as const;
export const RHYTHMIC_SHADOW_RECEIVER_Z = -4.02;
export const RHYTHMIC_AUTO_SHADOW_RECEIVER_Z = -1.12;
export const RHYTHMIC_BRICK_SHADOW_RECEIVER_Z = -4.06;
export const RHYTHMIC_TUBE_BOARD_SHADOW_RECEIVER_Z = -4;
export const RHYTHMIC_XYLOPHONE_SHADOW_RECEIVER_Z = -2.84;
export const RHYTHMIC_NEUTRAL_SHADOW_RECEIVER_Z = -3.64;
export const DENSE_CHASSIS_CENTER_Z = -0.62;
export const DENSE_CHASSIS_DEPTH = 0.22;
export const RHYTHMIC_SHOWCASE_WALL_CENTER_Y = -270;
export const RHYTHMIC_SHOWCASE_WALL_HEIGHT = 560;
export const RHYTHMIC_ROOM_BACKDROP_WIDTH = 80;
export const RHYTHMIC_ROOM_SIDE_X = 18.5;

export function rhythmicRecordingRenderProfile(exportFps: number) {
  if (exportFps >= 120) {
    return { dpr: 1, transmissionResolutionScale: 0.55, shadowMapSize: 512 } as const;
  }
  if (exportFps >= 60) {
    return { dpr: 1.35, transmissionResolutionScale: 0.68, shadowMapSize: 1024 } as const;
  }
  return { dpr: 1.5, transmissionResolutionScale: 0.78, shadowMapSize: 1024 } as const;
}

export interface RhythmicBackdropBounds {
  centerY: number;
  height: number;
  topY: number;
  bottomY: number;
}

export function courseBackdropBounds(worldYs: number[], padding = 24): RhythmicBackdropBounds {
  let highest = Number.NEGATIVE_INFINITY;
  let lowest = Number.POSITIVE_INFINITY;
  for (const y of worldYs) {
    if (!Number.isFinite(y)) continue;
    highest = Math.max(highest, y);
    lowest = Math.min(lowest, y);
  }
  const hasPoints = Number.isFinite(highest) && Number.isFinite(lowest);
  const topY = Math.max(14, (hasPoints ? highest : -10) + padding);
  const bottomY = Math.min(-122, (hasPoints ? lowest : -98) - padding);
  return {
    centerY: (topY + bottomY) * 0.5,
    height: topY - bottomY,
    topY,
    bottomY,
  };
}

export function shadowReceiverZForSettings(settings: Pick<StudioSettings, "instrumentFamily" | "backgroundPreset" | "terrainProfile">) {
  if (settings.backgroundPreset === "brick-wall") return RHYTHMIC_BRICK_SHADOW_RECEIVER_Z;
  if (settings.backgroundPreset === "tube-board-dark") return RHYTHMIC_TUBE_BOARD_SHADOW_RECEIVER_Z;
  if (settings.backgroundPreset === "xylophone-room" || settings.backgroundPreset === "instrument-room") return RHYTHMIC_XYLOPHONE_SHADOW_RECEIVER_Z;
  if (settings.backgroundPreset === "comet-void" || settings.backgroundPreset === "deep-space") {
    return settings.instrumentFamily === "auto" ? RHYTHMIC_AUTO_SHADOW_RECEIVER_Z : RHYTHMIC_SHADOW_RECEIVER_Z;
  }
  if (settings.backgroundPreset === "spotlight") {
    return settings.instrumentFamily === "auto" ? RHYTHMIC_NEUTRAL_SHADOW_RECEIVER_Z : RHYTHMIC_SHADOW_RECEIVER_Z;
  }
  if (settings.terrainProfile === "tube-board") return RHYTHMIC_TUBE_BOARD_SHADOW_RECEIVER_Z;
  if (settings.terrainProfile === "xylophone") return RHYTHMIC_XYLOPHONE_SHADOW_RECEIVER_Z;
  if (settings.terrainProfile === "comet") return RHYTHMIC_AUTO_SHADOW_RECEIVER_Z;
  return settings.instrumentFamily === "auto" ? RHYTHMIC_NEUTRAL_SHADOW_RECEIVER_Z : RHYTHMIC_SHADOW_RECEIVER_Z;
}

export function needsDedicatedShadowReceiver(kind: "tube-board" | "comet" | "xylophone" | "brick" | "neutral") {
  return kind === "comet";
}

export function roomBackdropCoversFrame(backdropWidth: number, cameraX: number, viewWidth: number, overscan = 1) {
  return backdropWidth * 0.5 >= Math.abs(cameraX) + viewWidth * 0.5 + overscan;
}

export function wallMountProfile(frontDepth: number, receiverZ = RHYTHMIC_SHADOW_RECEIVER_Z) {
  const anchorThickness = 0.08;
  // All values are local to the instrument group, whose origin sits at
  // -frontDepth. The anchor face and the shadow catcher therefore resolve to
  // the exact same world-space plane for every instrument body depth.
  const anchorZ = receiverZ + frontDepth;
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

export function denseChassisMountProfile(receiverZ: number) {
  const anchorThickness = 0.08;
  const chassisBackZ = DENSE_CHASSIS_CENTER_Z - DENSE_CHASSIS_DEPTH * 0.5;
  const anchorFrontZ = receiverZ + anchorThickness;
  return {
    anchorCenterZ: receiverZ + anchorThickness * 0.5,
    anchorThickness,
    stemCenterZ: (chassisBackZ + anchorFrontZ) * 0.5,
    stemLength: Math.max(0.02, chassisBackZ - anchorFrontZ),
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

export function crossedRhythmicHit(previousTimeMs: number, timeMs: number, eventTimeMs: number) {
  return previousTimeMs < eventTimeMs && timeMs >= eventTimeMs;
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
