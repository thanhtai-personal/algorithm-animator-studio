import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { StudioSettings } from "../types";
import { presetCameraScale, projectPresetCamera } from "./presetCamera";

export const PLATFORM_PRELOAD_AHEAD_COUNT = 7;
export const PLATFORM_3D_RETAIN_BEHIND_PX = 1_600;
export const PLATFORM_3D_PRELOAD_AHEAD_PX = 3_200;
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
export function platformsMountedFor3D(platforms: readonly MarblePlatform[], focusIndex: number): readonly MarblePlatform[] {
  if (!platforms.length) return platforms;
  const focusOffset = Math.max(0, platforms.findIndex((platform) => platform.index === focusIndex));
  const focus = platforms[focusOffset] ?? platforms[0];
  const focusY = displayGeometry(focus).y;
  const next = platforms[Math.min(platforms.length - 1, focusOffset + 1)];
  const courseDirection = Math.sign(displayGeometry(next).y - focusY) || 1;
  const minY = focusY - (courseDirection > 0 ? PLATFORM_3D_RETAIN_BEHIND_PX : PLATFORM_3D_PRELOAD_AHEAD_PX);
  const maxY = focusY + (courseDirection > 0 ? PLATFORM_3D_PRELOAD_AHEAD_PX : PLATFORM_3D_RETAIN_BEHIND_PX);

  return platforms.filter((platform) => {
    const display = displayGeometry(platform);
    const halfVerticalExtent = Math.abs(Math.sin(display.angle)) * display.width * 0.5
      + Math.abs(Math.cos(display.angle)) * display.thickness * 0.5;
    return display.y + halfVerticalExtent >= minY && display.y - halfVerticalExtent <= maxY;
  });
}
