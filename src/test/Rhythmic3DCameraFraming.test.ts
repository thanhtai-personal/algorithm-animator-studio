import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { cameraDepthProfile } from "../features/rhythmic-studio/components/rhythmicSceneMath3D";

describe("rhythmic 3D camera framing", () => {
  it("frames showcase instruments close enough to read in a portrait export", () => {
    const profile = cameraDepthProfile({
      ...DEFAULT_SETTINGS,
      instrumentFamily: "boomwhacker",
      cameraProfile: "xylophone",
    });

    expect(profile.offset).toBeLessThan(0);
    expect(profile.near).toBeLessThanOrEqual(8);
    expect(profile.far).toBeLessThanOrEqual(11);
  });

  it("keeps a deeper range for the comet environment", () => {
    const showcase = cameraDepthProfile({ ...DEFAULT_SETTINGS, instrumentFamily: "marimba" });
    const comet = cameraDepthProfile({ ...DEFAULT_SETTINGS, cameraProfile: "comet" });
    expect(comet.near).toBeGreaterThan(showcase.near);
    expect(comet.far).toBeGreaterThan(showcase.far);
  });
});
