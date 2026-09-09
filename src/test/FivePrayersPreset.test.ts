import { describe, expect, it } from "vitest";
import { fivePrayersPreset } from "@/features/preset-video/presets/five-prayers/fivePrayersPreset";
import {
  createDefaultPresetVideoSettings,
  loadPresetVideoSettings,
  savePresetVideoSettings,
} from "@/features/preset-video/lib/presetVideoDraft";
import {
  FIVE_PRAYERS_DURATION_SECONDS,
  FIVE_PRAYERS_LYRIC_CUES,
  getFivePrayersLyricCue,
} from "@/features/preset-video/presets/five-prayers/fivePrayersContent";

describe("Five Prayers preset", () => {
  it("uses speech-aligned lyric anchors from the bundled recording", () => {
    expect(fivePrayersPreset.editableLyrics).toBe(FIVE_PRAYERS_LYRIC_CUES);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-1-001")).toMatchObject({ start: 0, end: 6.08 });
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-2-001")?.start).toBe(245.7);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-3-001")?.start).toBe(526.14);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-4-001")?.start).toBe(734.8);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-5-001")?.start).toBe(959.86);
    expect(FIVE_PRAYERS_LYRIC_CUES.at(-1)?.end).toBe(1217.68);
  });

  it("keeps every cue ordered, non-overlapping, and inside the audio duration", () => {
    for (let index = 0; index < FIVE_PRAYERS_LYRIC_CUES.length; index += 1) {
      const cue = FIVE_PRAYERS_LYRIC_CUES[index];
      const previous = FIVE_PRAYERS_LYRIC_CUES[index - 1];
      expect(cue.end).toBeGreaterThan(cue.start);
      expect(cue.start).toBeGreaterThanOrEqual(0);
      expect(cue.end).toBeLessThanOrEqual(FIVE_PRAYERS_DURATION_SECONDS);
      if (previous) expect(cue.start).toBeGreaterThanOrEqual(previous.end);
    }
  });

  it("applies editable timing overrides during cue lookup", () => {
    expect(getFivePrayersLyricCue(246, {
      "prayer-2-001": { start: 250, end: 252 },
    })?.id).not.toBe("prayer-2-001");
    expect(getFivePrayersLyricCue(250.5, {
      "prayer-2-001": { start: 250, end: 252 },
    })?.id).toBe("prayer-2-001");
  });

  it("invalidates locally saved timings from the old estimated map", () => {
    const defaults = createDefaultPresetVideoSettings(fivePrayersPreset);
    savePresetVideoSettings(fivePrayersPreset.id, {
      ...defaults,
      lyricTimingRevision: 1,
      lyricTimings: {
        ...defaults.lyricTimings,
        "prayer-1-001": { start: 10, end: 12 },
      },
    });

    expect(loadPresetVideoSettings(fivePrayersPreset).lyricTimings["prayer-1-001"]).toEqual({ start: 0, end: 6.08 });
  });
});
