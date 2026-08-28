import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { wallScoreReferenceHits } from "../features/rhythmic-studio/lib/korobeinikiReferenceLayout";
import {
  addInstrumentMixSegment,
  buildAutomaticInstrumentMix,
  buildPhraseInstrumentPlan,
  createInstrumentMixSettingsResolver,
  createPhraseInstrumentSettingsResolver,
  removeInstrumentMixSegment,
  updateInstrumentMixSegmentFamily,
  updateInstrumentMixSegmentDuration,
} from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function note(index: number, timeMs: number): NoteEvent {
  return { id: `phrase-instrument-${index}`, timeMs, midi: 60 + (index % 12), velocity: 0.8, durationMs: 120 };
}

function ninePhraseEvents() {
  return Array.from({ length: 9 }, (_, phrase) => [
    note(phrase * 3, phrase * 1_400),
    note(phrase * 3 + 1, phrase * 1_400 + 180),
    note(phrase * 3 + 2, phrase * 1_400 + 360),
  ]).flat();
}

describe("mixed instruments follow musical phrases", () => {
  it("finds musical phrases without splitting simultaneous strikes", () => {
    const events = [
      note(0, 0), note(1, 180), note(2, 360), note(3, 360),
      note(4, 1_400), note(5, 1_590), note(6, 1_780),
      note(7, 2_850), note(8, 3_050), note(9, 3_250),
    ];
    const plan = buildPhraseInstrumentPlan(events);

    expect(plan).toHaveLength(3);
    expect(plan.map((segment) => [segment.startIndex, segment.endIndex])).toEqual([[0, 3], [4, 6], [7, 9]]);
  });

  it("automatically keeps one instrument for three phrases before switching", () => {
    const events = ninePhraseEvents();
    const plan = buildAutomaticInstrumentMix(events, 12_000);

    expect(plan).toHaveLength(3);
    expect(plan.map((segment) => segment.family)).toEqual(["piano", "xylophone", "marimba"]);
    expect(plan.map((segment) => [segment.startMs, segment.endMs])).toEqual([
      [0, 4_200],
      [4_200, 8_400],
      [8_400, 12_000],
    ]);
  });

  it("snaps a configured duration to a note boundary and keeps the plan continuous", () => {
    const events = ninePhraseEvents();
    const plan = buildAutomaticInstrumentMix(events, 12_000);
    const updated = updateInstrumentMixSegmentDuration(plan, plan[0].id, 5.5, events, 12_000);

    expect(updated[0].endMs).toBe(5_600);
    expect(updated[1].startMs).toBe(updated[0].endMs);
    expect(updated[2].startMs).toBe(updated[1].endMs);
    expect(updated.at(-1)?.endMs).toBe(12_000);
  });

  it("resolves the configured family on both sides of a custom boundary", () => {
    const events = ninePhraseEvents();
    const plan = buildAutomaticInstrumentMix(events, 12_000);
    const base = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const };
    const resolve = createInstrumentMixSettingsResolver(events, plan, () => base);

    expect(resolve(8).instrumentFamily).toBe("piano");
    expect(resolve(9).instrumentFamily).toBe("xylophone");
    expect(resolve(18).instrumentFamily).toBe("marimba");
  });

  it("supports changing, adding and removing configured instrument rows", () => {
    const events = ninePhraseEvents();
    const automatic = buildAutomaticInstrumentMix(events, 12_000);
    const changed = updateInstrumentMixSegmentFamily(automatic, automatic[0].id, "gong");
    const added = addInstrumentMixSegment(changed, events, 12_000);
    const removed = removeInstrumentMixSegment(added, added[1].id, events, 12_000);

    expect(changed[0].family).toBe("gong");
    expect(added).toHaveLength(automatic.length + 1);
    expect(removed).toHaveLength(automatic.length);
    expect(added[0].startMs).toBe(0);
    expect(added.at(-1)?.endMs).toBe(12_000);
    added.slice(1).forEach((segment, index) => expect(segment.startMs).toBe(added[index].endMs));
  });

  it("uses the MIDI-derived schedule when no custom plan is supplied", () => {
    const events = ninePhraseEvents();
    const base = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const };
    const resolve = createPhraseInstrumentSettingsResolver(events, () => base);

    expect(resolve(0).instrumentFamily).toBe("piano");
    expect(resolve(8).instrumentFamily).toBe("piano");
    expect(resolve(9).instrumentFamily).toBe("xylophone");
  });

  it("changes meshes by configured phrase group without leaving the shared wall-score", () => {
    const events = ninePhraseEvents();
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const };
    const course = buildMarbleCourse(events, settings, 720);
    const expectedHits = wallScoreReferenceHits(events, 720);

    expect(course[0].visualStyle).toBe("piano-key");
    expect(course[8].visualStyle).toBe("piano-key");
    expect(course[9].visualStyle).toBe("xylophone-bar");
    course.forEach((platform, index) => {
      expect(platform.hitX).toBeCloseTo(expectedHits[index].x, 5);
      expect(platform.hitY).toBeCloseTo(expectedHits[index].y, 5);
    });
  });
});
