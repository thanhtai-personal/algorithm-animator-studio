import type { StudioSettings } from "../types";
import { usesSharedWallScore } from "./wallScoreLayout";

export interface CameraPoint { x: number; y: number }

export function presetCameraAnchorX(settings: StudioSettings) {
  if (settings.cameraProfile === "comet") return 0.64;
  if (settings.cameraProfile === "xylophone") return 0.54;
  return 0.5;
}

export function presetCameraScale(settings: StudioSettings) {
  if (usesSharedWallScore(settings)) return 1.22;
  // 2D instruments need to keep a readable face size. The old xylophone value
  // (0.82) zoomed out by 18%, which made dense/fast runs look like distant
  // thumbnails. These close-up values keep instrument faces legible and let
  // the moving camera reveal the course instead of exposing the whole run.
  if (settings.cameraProfile === "xylophone") return 1.48;
  if (settings.cameraProfile === "tube-board") return 1.38;
  if (settings.cameraProfile === "comet") return 1.32;
  return 1.34;
}

function matrix(settings: StudioSettings) {
  const scale = presetCameraScale(settings);
  // Canvas 2D is an orthographic renderer. A non-uniform scale or shear changes
  // the apparent angle of every collision surface and turns the marble into an
  // ellipse, so profile framing may zoom but must preserve geometry angles.
  return { a: scale, b: 0, c: 0, d: scale };
}

function cameraPivot(settings: StudioSettings, width: number, height: number) {
  return { x: width / 2, y: height * (settings.cameraProfile === "xylophone" ? 0.455 : 0.5) };
}

export function projectPresetCamera(point: CameraPoint, settings: StudioSettings, width: number, height: number): CameraPoint {
  const { a, b, c, d } = matrix(settings);
  const pivot = cameraPivot(settings, width, height);
  const x = point.x - pivot.x;
  const y = point.y - pivot.y;
  return { x: a * x + c * y + pivot.x, y: b * x + d * y + pivot.y };
}

export function applyPresetCamera(ctx: CanvasRenderingContext2D, settings: StudioSettings, width: number, height: number) {
  const { a, b, c, d } = matrix(settings);
  const pivot = cameraPivot(settings, width, height);
  ctx.translate(pivot.x, pivot.y);
  ctx.transform(a, b, c, d, 0, 0);
  ctx.translate(-pivot.x, -pivot.y);
}

export function unprojectPresetCamera(point: CameraPoint, settings: StudioSettings, width: number, height: number): CameraPoint {
  const { a, b, c, d } = matrix(settings);
  const pivot = cameraPivot(settings, width, height);
  const px = point.x - pivot.x;
  const py = point.y - pivot.y;
  const det = a * d - b * c || 1;
  return {
    x: (d * px - c * py) / det + pivot.x,
    y: (-b * px + a * py) / det + pivot.y,
  };
}

export function cameraOffsetFor2DFocus(
  focus: CameraPoint,
  settings: StudioSettings,
  width: number,
  height: number,
): CameraPoint {
  // The requested anchor is a screen-space position. Convert it through the
  // inverse preset transform before deriving the world camera offset; directly
  // subtracting width/height anchors is only correct when scale === 1.
  const anchorBeforeProjection = unprojectPresetCamera({
    x: width * presetCameraAnchorX(settings),
    y: height * settings.cameraAnchor,
  }, settings, width, height);
  return {
    x: focus.x - anchorBeforeProjection.x,
    y: focus.y - anchorBeforeProjection.y,
  };
}
