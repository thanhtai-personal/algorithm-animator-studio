import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  cameraDepthProfile,
  cameraFollowDamping,
  roomBackdropCoversFrame,
  RHYTHMIC_ROOM_BACKDROP_WIDTH,
  RHYTHMIC_ROOM_SIDE_X,
  steadyCameraAxisTarget,
  wallScoreCameraFov,
} from "../features/rhythmic-studio/components/rhythmicSceneMath3D";
import { presetCameraScale } from "../features/rhythmic-studio/lib/presetCamera";

describe("rhythmic 3D camera framing", () => {
  it("frames shared wall-score instruments wide enough to avoid dizzy camera motion", () => {
    const profile = cameraDepthProfile({
      ...DEFAULT_SETTINGS,
      instrumentFamily: "boomwhacker",
      cameraProfile: "xylophone",
    });

    expect(profile.offset).toBeGreaterThan(-0.6);
    expect(profile.near).toBeGreaterThanOrEqual(9);
    expect(profile.far).toBeGreaterThanOrEqual(12);
    expect(presetCameraScale({
      ...DEFAULT_SETTINGS,
      instrumentFamily: "boomwhacker",
      cameraProfile: "xylophone",
    })).toBeCloseTo(1.22, 5);
  });

  it("holds a wide wall-score camera inside a lateral dead zone", () => {
    expect(steadyCameraAxisTarget(1, 1.42, 0.5)).toBe(1);
    expect(steadyCameraAxisTarget(1, 2, 0.5)).toBe(1.5);
    expect(steadyCameraAxisTarget(1, -0.2, 0.5)).toBe(0.3);
    expect(cameraFollowDamping(0.24, true)).toBeLessThan(5);
    expect(wallScoreCameraFov(1.2, 6, false)).toBeGreaterThanOrEqual(40);
  });

  it("keeps a deeper range for the comet environment", () => {
    const showcase = cameraDepthProfile({ ...DEFAULT_SETTINGS, instrumentFamily: "marimba" });
    const comet = cameraDepthProfile({ ...DEFAULT_SETTINGS, cameraProfile: "comet" });
    expect(comet.near).toBeGreaterThan(showcase.near);
    expect(comet.far).toBeGreaterThan(showcase.far);
  });

  it("keeps the studio wall behind a laterally-following landscape camera", () => {
    expect(roomBackdropCoversFrame(RHYTHMIC_ROOM_BACKDROP_WIDTH, 8, 18)).toBe(true);
    expect(roomBackdropCoversFrame(17, 8, 18)).toBe(false);
    expect(RHYTHMIC_ROOM_SIDE_X).toBeGreaterThan(17);
  });
});
