import { describe, expect, it } from "vitest";
import { numberEightInRedPreset } from "@/features/preset-video/presets/number-eight-in-red/numberEightInRedPreset";
import {
  NUMBER_EIGHT_DURATION_SECONDS,
  NUMBER_EIGHT_FIRST_BEAT_SECONDS,
  NUMBER_EIGHT_LYRIC_CUES,
  NUMBER_EIGHT_VISUAL_SOURCES,
  getNumberEightLyricCue,
} from "@/features/preset-video/presets/number-eight-in-red/numberEightInRedContent";

describe("Number Eight In Red preset", () => {
  it("matches the bundled song duration and exposes editable lyric/video sources", () => {
    expect(numberEightInRedPreset.defaultDurationSeconds).toBe(NUMBER_EIGHT_DURATION_SECONDS);
    expect(numberEightInRedPreset.hasOriginalAudio).toBe(true);
    expect(numberEightInRedPreset.defaultOutputPreset).toBe("landscape-1080p");
    expect(numberEightInRedPreset.editableLyrics).toBe(NUMBER_EIGHT_LYRIC_CUES);
    expect(numberEightInRedPreset.videoSources).toBe(NUMBER_EIGHT_VISUAL_SOURCES);
  });

  it("anchors lyric timing to the measured beat grid and keeps cues ordered", () => {
    expect(NUMBER_EIGHT_LYRIC_CUES[0]?.start).toBe(NUMBER_EIGHT_FIRST_BEAT_SECONDS);
    expect(NUMBER_EIGHT_LYRIC_CUES.at(-1)?.end).toBe(NUMBER_EIGHT_DURATION_SECONDS);
    expect(NUMBER_EIGHT_LYRIC_CUES.find((cue) => cue.id === "opening-2")?.start).toBeCloseTo(5.015, 3);
    expect(NUMBER_EIGHT_LYRIC_CUES.find((cue) => cue.id === "chorus-1-2")?.start).toBeCloseTo(63.254, 3);

    for (let index = 1; index < NUMBER_EIGHT_LYRIC_CUES.length; index += 1) {
      const previous = NUMBER_EIGHT_LYRIC_CUES[index - 1];
      const current = NUMBER_EIGHT_LYRIC_CUES[index];
      expect(current.start).toBeGreaterThanOrEqual(previous.end);
      expect(current.end).toBeGreaterThan(current.start);
    }

    const completeLyrics = NUMBER_EIGHT_LYRIC_CUES.flatMap((cue) => cue.lines).join(" ");
    expect(completeLyrics).toContain("Number eight in red");
    expect(completeLyrics).toContain("Wrong way keeper");
    expect(completeLyrics).toContain("United! United!");
  });

  it("applies user timing overrides to preview/export cue lookup", () => {
    const overridden = getNumberEightLyricCue(6.2, {
      "opening-2": { start: 6, end: 7 },
    });
    expect(overridden?.id).toBe("opening-2");
    expect(overridden?.start).toBe(6);
    expect(getNumberEightLyricCue(5.2, { "opening-2": { start: 6, end: 7 } })?.id).not.toBe("opening-2");
  });

  it("uses short video excerpts from official Manchester United YouTube sources", () => {
    expect(NUMBER_EIGHT_VISUAL_SOURCES).toHaveLength(4);
    for (const source of NUMBER_EIGHT_VISUAL_SOURCES) {
      expect(source.watchUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
      expect(source.thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\/vi\//);
      expect(source.clipEndSeconds - source.clipStartSeconds).toBeGreaterThanOrEqual(0.5);
      expect(source.clipEndSeconds - source.clipStartSeconds).toBeLessThanOrEqual(20);
    }
  });
});
