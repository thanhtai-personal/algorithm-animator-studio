import { describe, expect, it } from "vitest";
import type { RaceCameraShot } from "../features/marble-tower-video/camera/raceCameraPlan";
import {
  FINISH_CAMERA_HEIGHT_ABOVE_PACK,
  FINISH_CAMERA_BLEND_END,
  FINISH_CAMERA_BLEND_START,
  finishCameraBlend,
  finishCameraLookAhead,
  finishCameraPackSize,
  finishCameraShot,
} from "../features/marble-tower-video/camera/finishCameraFraming";
import { TRACK_WIDTH } from "../features/marble-tower-video/track/towerCourse";

describe("Marble Tower finish camera clearance", () => {
  it("moves above the lane wall and frames the pack plus the obstacles ahead", () => {
    expect(finishCameraBlend(FINISH_CAMERA_BLEND_START - 0.001)).toBe(0);
    expect(finishCameraBlend(FINISH_CAMERA_BLEND_END + 0.001)).toBe(1);

    const chaos: RaceCameraShot = { behind: 4.8, lift: 5.2, side: 6, fov: 53 };
    const before = finishCameraShot(chaos, FINISH_CAMERA_BLEND_START);
    const middle = finishCameraShot(chaos, (FINISH_CAMERA_BLEND_START + FINISH_CAMERA_BLEND_END) / 2);
    const finish = finishCameraShot(chaos, FINISH_CAMERA_BLEND_END);

    expect(middle.lift).toBeGreaterThan(before.lift);
    expect(finish.lift).toBeGreaterThanOrEqual(4);
    expect(Math.abs(finish.side)).toBeLessThan(TRACK_WIDTH / 2 - 0.5);
    expect(finish.behind).toBeGreaterThanOrEqual(11);
    expect(finish.fov).toBeGreaterThanOrEqual(56);
    expect(FINISH_CAMERA_HEIGHT_ABOVE_PACK).toBeGreaterThanOrEqual(4);
    expect(finishCameraPackSize(FINISH_CAMERA_BLEND_END)).toBeGreaterThanOrEqual(8);
    expect(finishCameraLookAhead(FINISH_CAMERA_BLEND_END)).toBeGreaterThanOrEqual(7);
  });
});
