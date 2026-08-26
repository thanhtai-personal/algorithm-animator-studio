import { describe, expect, it } from "vitest";
import type { RaceCameraShot } from "../features/marble-tower-video/camera/raceCameraPlan";
import {
  FINISH_CAMERA_BLEND_END,
  FINISH_CAMERA_BLEND_START,
  finishCameraBlend,
  finishCameraShot,
} from "../features/marble-tower-video/camera/finishCameraFraming";

describe("Marble Tower finish camera clearance", () => {
  it("moves to a low outside finish shot before the winner reaches the line", () => {
    expect(finishCameraBlend(FINISH_CAMERA_BLEND_START - 0.001)).toBe(0);
    expect(finishCameraBlend(FINISH_CAMERA_BLEND_END + 0.001)).toBe(1);

    const chaos: RaceCameraShot = { behind: 4.8, lift: 5.2, side: 6, fov: 53 };
    const before = finishCameraShot(chaos, FINISH_CAMERA_BLEND_START);
    const middle = finishCameraShot(chaos, (FINISH_CAMERA_BLEND_START + FINISH_CAMERA_BLEND_END) / 2);
    const finish = finishCameraShot(chaos, FINISH_CAMERA_BLEND_END);

    expect(middle.lift).toBeLessThan(before.lift);
    expect(finish.lift).toBeLessThanOrEqual(1.7);
    expect(finish.side).toBeGreaterThanOrEqual(9);
    expect(finish.behind).toBeLessThanOrEqual(5);
  });
});
