import { describe, expect, it } from "vitest";
import { shiftLyricCues } from "@/features/video-editor/lib/videoEditorLyrics";

describe("shiftLyricCues", () => {
  const cues = [{
    id: "line-1",
    start: 1.25,
    end: 3.5,
    text: "hello world",
    words: [
      { text: "hello ", start: 1.25, end: 2.1 },
      { text: "world", start: 2.15, end: 3.5 },
    ],
  }];

  it("adds a positive decimal offset to cue and word timestamps", () => {
    expect(shiftLyricCues(cues, 0.75)).toEqual([{
      ...cues[0],
      start: 2,
      end: 4.25,
      words: [
        { text: "hello ", start: 2, end: 2.85 },
        { text: "world", start: 2.9, end: 4.25 },
      ],
    }]);
  });

  it("keeps negative timestamps so an early shift is exact and can be reversed", () => {
    const shifted = shiftLyricCues(cues, -1.5);
    expect(shifted[0].start).toBe(-0.25);
    expect(shifted[0].end).toBe(2);
    expect(shifted[0].words[0].start).toBe(-0.25);
    expect(shiftLyricCues(shifted, 1.5)).toEqual(cues);
  });
});
