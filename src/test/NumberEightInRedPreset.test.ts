import { describe, expect, it } from "vitest";
import { numberEightInRedPreset } from "@/features/preset-video/presets/number-eight-in-red/numberEightInRedPreset";
import {
  NUMBER_EIGHT_DURATION_SECONDS,
  NUMBER_EIGHT_LYRIC_CUES,
  NUMBER_EIGHT_VISUAL_SOURCES,
} from "@/features/preset-video/presets/number-eight-in-red/numberEightInRedContent";

describe("Number Eight In Red preset", () => {
  it("matches the bundled song duration and exposes original-audio controls", () => {
    expect(numberEightInRedPreset.defaultDurationSeconds).toBe(NUMBER_EIGHT_DURATION_SECONDS);
    expect(numberEightInRedPreset.hasOriginalAudio).toBe(true);
    expect(numberEightInRedPreset.defaultOutputPreset).toBe("landscape-1080p");
  });

  it("keeps lyric cues ordered and covers the complete song structure", () => {
    expect(NUMBER_EIGHT_LYRIC_CUES[0]?.start).toBeLessThan(1);
    expect(NUMBER_EIGHT_LYRIC_CUES.at(-1)?.end).toBe(NUMBER_EIGHT_DURATION_SECONDS);

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

  it("uses only transformed still references from the official Manchester United YouTube channel", () => {
    expect(NUMBER_EIGHT_VISUAL_SOURCES).toHaveLength(4);
    for (const source of NUMBER_EIGHT_VISUAL_SOURCES) {
      expect(source.watchUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
      expect(source.thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\/vi\//);
    }
  });
});
