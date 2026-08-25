import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { StudioSettings } from "../types";
import { projectPresetCamera } from "./presetCamera";

export const PLATFORM_PRELOAD_MARGIN_PX = 220;

interface Viewport2D {
  width: number;
  height: number;
  cameraX: number;
  cameraY: number;
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
  const margin = PLATFORM_PRELOAD_MARGIN_PX;
  return bounds.right >= -margin
    && bounds.left <= viewport.width + margin
    && bounds.bottom >= -margin
    && bounds.top <= viewport.height + margin;
}

/** Keep scene nodes alive; Three.js performs spatial frustum culling per mesh. */
export function platformsMountedFor3D<T>(platforms: readonly T[]): readonly T[] {
  return platforms;
}
