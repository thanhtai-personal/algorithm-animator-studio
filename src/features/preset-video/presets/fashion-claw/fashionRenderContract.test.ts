import { describe, expect, it } from "vitest";
import { fashionClawPreset } from "./fashionClawPreset";
import { getFashionLookAtFrame, FASHION_LOOK_CUT_FRAMES } from "./fashionOutfitTimeline";
import { createDefaultPresetVideoSettings } from "../../lib/presetVideoDraft";

/** The preset, Player and renderer all derive duration from seconds * fps. */
describe("T07 Fashion Fan source-frame contract", () => {
  const fps = fashionClawPreset.defaultFps;
  const seconds = fashionClawPreset.defaultDurationSeconds;

  it("renders exactly the 296 frames supplied by the reference", () => {
    expect(fps).toBe(30);
    expect(Math.round(seconds * fps)).toBe(296); // Player and Root calculateMetadata
    expect(Math.ceil(seconds * fps) - 1).toBe(295); // Server inclusive frameRange
    expect(getFashionLookAtFrame(295).id).toBe("pink");
  });

  it("uses the same full duration in default trim settings", () => {
    const settings = createDefaultPresetVideoSettings(fashionClawPreset);
    expect(settings.trimStartSeconds).toBe(0);
    expect(settings.trimEndSeconds).toBe(seconds);
    expect(settings.outputPreset).toBe("portrait-1080p");
    expect(Math.ceil(settings.trimEndSeconds * fps) - 1).toBe(295);
  });

  it("keeps all three changes inside the 296-frame composition", () => {
    expect(FASHION_LOOK_CUT_FRAMES).toEqual([139, 184, 248]);
    for (const frame of FASHION_LOOK_CUT_FRAMES) {
      expect(frame).toBeGreaterThan(0);
      expect(frame).toBeLessThan(296);
    }
  });
});
