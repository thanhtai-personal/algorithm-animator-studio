import type { StudioSettings } from "../types";

export interface CameraPoint { x: number; y: number }

export function presetCameraAnchorX(settings: StudioSettings) {
  if (settings.cameraProfile === "comet") return 0.64;
  if (settings.cameraProfile === "xylophone") return 0.54;
  return 0.5;
}

function matrix(settings: StudioSettings) {
  if (settings.cameraProfile === "xylophone") return { a: 0.86, b: -0.02, c: 0, d: 0.72 };
  if (settings.cameraProfile === "tube-board") return { a: 1.0, b: -0.015, c: 0, d: 0.96 };
  if (settings.cameraProfile === "comet") return { a: 1.015, b: 0, c: 0, d: 1.0 };
  return { a: 1, b: 0, c: 0, d: 1 };
}

export function applyPresetCamera(ctx: CanvasRenderingContext2D, settings: StudioSettings, width: number, height: number) {
  const { a, b, c, d } = matrix(settings);
  const cx = width / 2;
  const cy = height * (settings.cameraProfile === "xylophone" ? 0.455 : 0.5);
  ctx.translate(cx, cy);
  ctx.transform(a, b, c, d, 0, 0);
  ctx.translate(-cx, -cy);
}

export function unprojectPresetCamera(point: CameraPoint, settings: StudioSettings, width: number, height: number): CameraPoint {
  const { a, b, c, d } = matrix(settings);
  const cx = width / 2;
  const cy = height * (settings.cameraProfile === "xylophone" ? 0.455 : 0.5);
  const px = point.x - cx;
  const py = point.y - cy;
  const det = a * d - b * c || 1;
  return {
    x: (d * px - c * py) / det + cx,
    y: (-b * px + a * py) / det + cy,
  };
}
