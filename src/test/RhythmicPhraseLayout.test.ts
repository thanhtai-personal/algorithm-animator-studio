import { describe, expect, it } from "vitest";
import { planRhythmicPhrases } from "../features/rhythmic-studio/engine/rhythmicPhraseLayout";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function note(index: number, timeMs: number, isDrum = false): NoteEvent {
  return { id: `phrase-${index}`, timeMs, midi: 60 + index, velocity: 0.8, durationMs: 100, isDrum };
}

describe("rhythmic phrase layout", () => {
  it("keeps chords together and splits scenes at a real musical rest", () => {
    const events = [
      note(0, 0), note(1, 8), note(2, 120), note(3, 240), note(4, 360),
      note(5, 1_200), note(6, 1_700), note(7, 2_200),
    ];

    const phrases = planRhythmicPhrases(events);

    expect(phrases).toHaveLength(2);
    expect(phrases[0]).toMatchObject({ startIndex: 0, endIndex: 4, layout: "connected-keys" });
    expect(phrases[1]).toMatchObject({ startIndex: 5, endIndex: 7, layout: "arc" });
  });

  it("uses parallel lanes for a readable fast phrase", () => {
    const events = [0, 220, 440, 660, 880].map((timeMs, index) => note(index, timeMs));
    const phrases = planRhythmicPhrases(events);

    expect(phrases).toHaveLength(1);
    expect(phrases[0].layout).toBe("parallel-lanes");
    expect(phrases[0].strikeCount).toBe(5);
  });

  it("creates deterministic bounded modules for long uninterrupted runs", () => {
    const events = Array.from({ length: 36 }, (_, index) => note(index, index * 110));
    const phrases = planRhythmicPhrases(events);

    expect(phrases.length).toBeGreaterThan(1);
    expect(phrases.every((phrase) => phrase.strikeCount <= 16)).toBe(true);
    expect(phrases[0].startIndex).toBe(0);
    expect(phrases.at(-1)?.endIndex).toBe(events.length - 1);
  });
});
