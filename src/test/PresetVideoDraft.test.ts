import { describe, expect, it, beforeEach } from "vitest";
import { algorithmExplainerPreset } from "@/features/preset-video/presets/algorithmExplainerPreset";
import { numberEightInRedPreset } from "@/features/preset-video/presets/number-eight-in-red/numberEightInRedPreset";
import { designerAiWorkflowPreset } from "@/features/preset-video/presets/designer-ai-workflow/designerAiPreset";
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

  it("resets timeline bounds when a preset content revision changes", () => {
    const defaults = createDefaultPresetVideoSettings(designerAiWorkflowPreset);

    savePresetVideoSettings(designerAiWorkflowPreset.id, {
      ...defaults,
      settingsRevision: 0,
      outputPreset: "portrait-720p",
      trimStartSeconds: 3,
      trimEndSeconds: 54,
      backgroundMusicVolume: 0.31,
    });

    expect(loadPresetVideoSettings(designerAiWorkflowPreset)).toMatchObject({
      settingsRevision: 1,
      outputPreset: "portrait-720p",
      trimStartSeconds: 0,
      trimEndSeconds: 78,
      backgroundMusicVolume: 0.31,
    });
  });

  it("maps every supported output preset to explicit dimensions", () => {
    expect(getPresetVideoOutputSize("landscape-1080p")).toMatchObject({ width: 1920, height: 1080, aspectRatio: "16:9" });
    expect(getPresetVideoOutputSize("portrait-720p")).toMatchObject({ width: 720, height: 1280, aspectRatio: "9:16" });
    expect(getPresetVideoOutputSize("square-1080p")).toMatchObject({ width: 1080, height: 1080, aspectRatio: "1:1" });
  });

  it("persists per-cue lyric timing overrides", () => {
    const defaults = createDefaultPresetVideoSettings(numberEightInRedPreset);
    expect(defaults.lyricTimings["opening-1"]).toEqual({ start: 1.486, end: 5.015 });

    savePresetVideoSettings(numberEightInRedPreset.id, {
      ...defaults,
      lyricTimings: {
        ...defaults.lyricTimings,
        "opening-1": { start: 1.6, end: 4.9 },
      },
    });

    expect(loadPresetVideoSettings(numberEightInRedPreset).lyricTimings["opening-1"]).toEqual({
      start: 1.6,
      end: 4.9,
    });
  });

});
