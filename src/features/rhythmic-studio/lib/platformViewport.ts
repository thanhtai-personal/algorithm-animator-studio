import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { StudioSettings } from "../types";
import { presetCameraScale, projectPresetCamera } from "./presetCamera";
import { isKorobeinikiWallLayout } from "./korobeinikiReferenceLayout";
import { usesSharedWallScore } from "./wallScoreLayout";

export const PLATFORM_PRELOAD_AHEAD_COUNT = 7;
// Roughly three screens behind and six screens ahead at the default WebGL
// scale. The former 1,600/3,200 window mounted 110 dense instruments on frame
// zero, making the scene expensive and visually noisy long before those props
// could enter the camera. This still keeps a complete upcoming phrase ready.
export const PLATFORM_3D_RETAIN_BEHIND_PX = 1_000;
export const PLATFORM_3D_PRELOAD_AHEAD_PX = 2_000;
export const KOROBEINIKI_3D_RETAIN_BEHIND_PX = 3_600;
export const KOROBEINIKI_3D_PRELOAD_AHEAD_PX = 3_600;
export const KOROBEINIKI_FULL_MOUNT_LIMIT = 96;
export const PLATFORM_3D_MOUNT_LIMIT = 72;
const PLATFORM_MIN_VERTICAL_OVERSCAN_PX = 720;
const PLATFORM_MIN_HORIZONTAL_OVERSCAN_PX = 320;

interface Viewport2D {
  width: number;
  height: number;
  cameraX: number;
  cameraY: number;
}

export function platformRenderMargin2D(settings: StudioSettings) {
  const cameraScale = presetCameraScale(settings);
  return {
    horizontal: cameraScale * Math.max(PLATFORM_MIN_HORIZONTAL_OVERSCAN_PX, settings.platformWidth * 2.5),
    vertical: cameraScale * Math.max(
      PLATFORM_MIN_VERTICAL_OVERSCAN_PX,
      settings.platformGap * PLATFORM_PRELOAD_AHEAD_COUNT + settings.platformWidth,
    ),
  };
}

function displayGeometry(platform: MarblePlatform) {
  return {
    x: platform.visualX ?? platform.x,
    y: platform.visualY ?? platform.y,
    width: platform.visualWidth ?? platform.width,
    thickness: platform.visualThickness ?? platform.thickness,
    angle: platform.visualTiltRad ?? platform.tiltRad,
  };
}

export function platformScreenBounds2D(platform: MarblePlatform, settings: StudioSettings, viewport: Viewport2D) {
  const display = displayGeometry(platform);
  const halfWidth = Math.max(1, display.width * 0.5);
  const halfHeight = Math.max(1, display.thickness * 0.5);
  const padding = Math.max(24, display.thickness * 0.75);
  const cosine = Math.cos(display.angle);
  const sine = Math.sin(display.angle);
  const points = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ].map(([localX, localY]) => projectPresetCamera({
    x: display.x - viewport.cameraX + localX * cosine - localY * sine,
    y: display.y - viewport.cameraY + localX * sine + localY * cosine,
  }, settings, viewport.width, viewport.height));

  return {
    left: Math.min(...points.map((point) => point.x)) - padding,
    right: Math.max(...points.map((point) => point.x)) + padding,
    top: Math.min(...points.map((point) => point.y)) - padding,
    bottom: Math.max(...points.map((point) => point.y)) + padding,
  };
}

export function platformIsInside2DRenderWindow(platform: MarblePlatform, settings: StudioSettings, viewport: Viewport2D) {
  const bounds = platformScreenBounds2D(platform, settings, viewport);
  const margin = platformRenderMargin2D(settings);
  return bounds.right >= -margin.horizontal
    && bounds.left <= viewport.width + margin.horizontal
    && bounds.bottom >= -margin.vertical
    && bounds.top <= viewport.height + margin.vertical;
}

/**
 * Keep a multi-screen spatial window mounted around the 3D camera focus. This
 * preserves instruments before entry and after exit without constructing an
 * entire multi-minute course in the first React frame.
 */
export function platformsMountedFor3D(
  platforms: readonly MarblePlatform[],
  focusIndex: number,
  settings?: StudioSettings,
): readonly MarblePlatform[] {
  if (!platforms.length) return platforms;
  const focusOffset = Math.max(0, platforms.findIndex((platform) => platform.index === focusIndex));
  const focus = platforms[focusOffset] ?? platforms[0];
  const focusY = displayGeometry(focus).y;
  const next = platforms[Math.min(platforms.length - 1, focusOffset + 1)];
  const courseDirection = Math.sign(displayGeometry(next).y - focusY) || 1;
  const wallScore = settings ? usesSharedWallScore(settings) : false;
  const korobeiniki = settings ? isKorobeinikiWallLayout(settings) : false;
  // The reference wall-score is intentionally small (39 tubes). Keep compact
  // wall scores mounted for the whole take so a caster cannot disappear while
  // its long projected shadow is still inside the camera. Large imported MIDIs
  // still use the spatial window below to avoid mounting hundreds of meshes.
  if (korobeiniki && platforms.length <= KOROBEINIKI_FULL_MOUNT_LIMIT) return platforms;
  const retainBehind = wallScore ? KOROBEINIKI_3D_RETAIN_BEHIND_PX : PLATFORM_3D_RETAIN_BEHIND_PX;
  const preloadAhead = wallScore ? KOROBEINIKI_3D_PRELOAD_AHEAD_PX : PLATFORM_3D_PRELOAD_AHEAD_PX;
  const minY = focusY - (courseDirection > 0 ? retainBehind : preloadAhead);
  const maxY = focusY + (courseDirection > 0 ? preloadAhead : retainBehind);

  const mounted = platforms.filter((platform) => {
    const display = displayGeometry(platform);
    const halfVerticalExtent = Math.abs(Math.sin(display.angle)) * display.width * 0.5
      + Math.abs(Math.cos(display.angle)) * display.thickness * 0.5;
    return display.y + halfVerticalExtent >= minY && display.y - halfVerticalExtent <= maxY;
  });
  if (mounted.length <= PLATFORM_3D_MOUNT_LIMIT) return mounted;
  const mountedFocus = Math.max(0, mounted.findIndex((platform) => platform.index === focus.index));
  const retainedBehind = Math.floor(PLATFORM_3D_MOUNT_LIMIT * 0.42);
  const start = Math.max(0, Math.min(
    mounted.length - PLATFORM_3D_MOUNT_LIMIT,
    mountedFocus - retainedBehind,
  ));
  return mounted.slice(start, start + PLATFORM_3D_MOUNT_LIMIT);
}
