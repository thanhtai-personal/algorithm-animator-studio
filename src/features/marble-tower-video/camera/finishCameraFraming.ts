import type { RaceCameraShot } from "./raceCameraPlan";

export const FINISH_CAMERA_BLEND_START = 0.855;
export const FINISH_CAMERA_BLEND_END = 0.965;
export const FINISH_CAMERA_HEIGHT_ABOVE_PACK = 4.6;

const FINISH_SHOT: RaceCameraShot = {
  behind: 13.5,
  lift: 5.8,
  side: 2.4,
  fov: 58,
};

function smoothstep01(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

export function finishCameraBlend(progress: number) {
  const span = FINISH_CAMERA_BLEND_END - FINISH_CAMERA_BLEND_START;
  return smoothstep01((progress - FINISH_CAMERA_BLEND_START) / span);
}

export function finishCameraPackSize(progress: number) {
  return Math.round(4 + finishCameraBlend(progress) * 4);
}

export function finishCameraLookAhead(progress: number) {
  return 2.8 + finishCameraBlend(progress) * 5.2;
}

export function finishCameraShot(base: RaceCameraShot, progress: number): RaceCameraShot {
  const amount = finishCameraBlend(progress);
  const mix = (from: number, to: number) => from + (to - from) * amount;
  return {
    behind: mix(base.behind, FINISH_SHOT.behind),
    lift: mix(base.lift, FINISH_SHOT.lift),
    side: mix(base.side, FINISH_SHOT.side),
    fov: mix(base.fov, FINISH_SHOT.fov),
  };
}
