import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { cameraDepthProfile, roomBackdropCoversFrame, RHYTHMIC_ROOM_BACKDROP_WIDTH, RHYTHMIC_ROOM_SIDE_X } from "../features/rhythmic-studio/components/rhythmicSceneMath3D";
import { presetCameraScale } from "../features/rhythmic-studio/lib/presetCamera";

describe("rhythmic 3D camera framing", () => {
  it("frames shared wall-score instruments wide enough to avoid dizzy camera motion", () => {
    const profile = cameraDepthProfile({
      ...DEFAULT_SETTINGS,
      instrumentFamily: "boomwhacker",
      cameraProfile: "xylophone",
    });

    expect(profile.offset).toBeLessThan(0);
    expect(profile.near).toBeGreaterThanOrEqual(8);
    expect(profile.far).toBeGreaterThanOrEqual(10.6);
    expect(presetCameraScale({
      ...DEFAULT_SETTINGS,
      instrumentFamily: "boomwhacker",
      cameraProfile: "xylophone",
    })).toBeCloseTo(1.22, 5);
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
