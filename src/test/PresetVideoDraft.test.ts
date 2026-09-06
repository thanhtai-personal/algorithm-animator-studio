import { describe, expect, it, beforeEach } from "vitest";
import { algorithmExplainerPreset } from "@/features/preset-video/presets/algorithmExplainerPreset";
import {
  clearPresetVideoSettings,
  createDefaultPresetVideoSettings,
  loadPresetVideoSettings,
  savePresetVideoSettings,
} from "@/features/preset-video/lib/presetVideoDraft";
import { getPresetVideoOutputSize } from "@/features/preset-video/outputPresets";

describe("preset video settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses source-defined defaults and persists editable export settings", () => {
    const defaults = createDefaultPresetVideoSettings(algorithmExplainerPreset);
    expect(defaults.outputPreset).toBe("landscape-1080p");
    expect(defaults.trimEndSeconds).toBe(18);

    savePresetVideoSettings(algorithmExplainerPreset.id, {
      ...defaults,
      outputPreset: "portrait-720p",
      trimStartSeconds: 2.5,
      trimEndSeconds: 8.5,
      backgroundMusicId: "library:test",
      backgroundMusicVolume: 0.35,
    });

    expect(loadPresetVideoSettings(algorithmExplainerPreset)).toMatchObject({
      outputPreset: "portrait-720p",
      trimStartSeconds: 2.5,
      trimEndSeconds: 8.5,
      backgroundMusicId: "library:test",
      backgroundMusicVolume: 0.35,
    });

    clearPresetVideoSettings(algorithmExplainerPreset.id);
    expect(loadPresetVideoSettings(algorithmExplainerPreset)).toEqual(defaults);
  });

  it("maps every supported output preset to explicit dimensions", () => {
    expect(getPresetVideoOutputSize("landscape-1080p")).toMatchObject({ width: 1920, height: 1080, aspectRatio: "16:9" });
    expect(getPresetVideoOutputSize("portrait-720p")).toMatchObject({ width: 720, height: 1280, aspectRatio: "9:16" });
    expect(getPresetVideoOutputSize("square-1080p")).toMatchObject({ width: 1080, height: 1080, aspectRatio: "1:1" });
  });
});
