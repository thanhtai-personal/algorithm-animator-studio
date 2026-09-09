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
  FIVE_PRAYERS_PRAYER_SECTIONS,
  FIVE_PRAYERS_TRACKS,
  getFivePrayersLyricCue,
  getFivePrayersPrayerSection,
} from "@/features/preset-video/presets/five-prayers/fivePrayersContent";

describe("Five Prayers preset", () => {
  it("uses speech-aligned lyric anchors from the bundled recording", () => {
    expect(fivePrayersPreset.editableLyrics).toBe(FIVE_PRAYERS_LYRIC_CUES);
    expect(fivePrayersPreset.lyricTimingRevision).toBe(2);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-1-001")).toMatchObject({ start: 0, end: 6.08 });
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-2-001")?.start).toBe(245.7);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-3-001")?.start).toBe(526.14);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-4-001")?.start).toBe(734.8);
    expect(FIVE_PRAYERS_LYRIC_CUES.find((cue) => cue.id === "prayer-5-001")?.start).toBe(959.86);
    expect(FIVE_PRAYERS_LYRIC_CUES.at(-1)?.end).toBe(1217.68);
  });

  it("keeps the active prayer name visible across lyric gaps", () => {
    expect(getFivePrayersPrayerSection(0).title).toBe("Dấu Thánh Giá");
    expect(getFivePrayersPrayerSection(18.3).title).toBe("Kinh Đức Chúa Thánh Thần");
    expect(getFivePrayersPrayerSection(150).title).toBe("Kinh Lạy Cha");
    expect(getFivePrayersPrayerSection(190).title).toBe("Kinh Kính Mừng");
    expect(getFivePrayersPrayerSection(230).title).toBe("Kinh Sáng Danh");
    expect(getFivePrayersPrayerSection(240).title).toBe("Kinh Tin");
    expect(getFivePrayersPrayerSection(510).title).toBe("Kinh Tin Kính");
    expect(getFivePrayersPrayerSection(520).title).toBe("Kinh Cáo Mình");
    expect(getFivePrayersPrayerSection(950).title).toBe("Kinh Trông Cậy");
    expect(getFivePrayersPrayerSection(1220).title).toBe("Năm Sự Mừng");

    for (const section of FIVE_PRAYERS_PRAYER_SECTIONS) {
      expect(section.end).toBeGreaterThan(section.start);
    }
  });

  it("uses automatic Catholic artwork sources for every prayer track", () => {
    expect(FIVE_PRAYERS_TRACKS).toHaveLength(5);
    for (const track of FIVE_PRAYERS_TRACKS) {
      expect(track.artwork.imageUrl).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
      expect(track.artwork.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
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
