import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { wallScoreTwoColumnHits } from "../features/rhythmic-studio/lib/korobeinikiReferenceLayout";
import {
  buildAutomaticInstrumentMix,
  buildPhraseInstrumentPlan,
  createInstrumentMixSettingsResolver,
  createPhraseInstrumentSettingsResolver,
  PHRASE_INSTRUMENT_SEQUENCE,
  recommendedInstrumentCountForMidi,
  updateInstrumentMixSegmentFamily,
  updateInstrumentMixSegmentDuration,
} from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import {
  addInstrumentMixSegment,
  removeInstrumentMixSegment,
} from "../features/rhythmic-studio/lib/instrumentMixRows";
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
  it("offers trumpet, drum, guitar, gong and Vietnamese bronze drum families", () => {
    expect(PHRASE_INSTRUMENT_SEQUENCE).toEqual(expect.arrayContaining([
      "trumpet",
      "drum",
      "guitar",
      "gong",
      "bronze-drum",
    ]));
  });

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

  it("does not mistake the spacing between sustained notes for a silent phrase break", () => {
    const events = [0, 700, 1_400, 2_100].map((timeMs, index) => ({
      ...note(index, timeMs),
      durationMs: 900,
    }));

    expect(buildPhraseInstrumentPlan(events)).toHaveLength(1);
    expect(buildAutomaticInstrumentMix(events, 3_200)).toHaveLength(1);
  });

  it("still splits a long held-note MIDI when onset spacing marks new visual phrases", () => {
    const events = Array.from({ length: 14 }, (_, index) => ({
      ...note(index, index * 700),
      durationMs: 900,
    }));
    const phrases = buildPhraseInstrumentPlan(events);

    expect(phrases.length).toBeGreaterThan(1);
    phrases.slice(0, -1).forEach((phrase) => {
      const next = phrases[phrase.id + 1];
      expect(next.startMs - phrase.startMs).toBeLessThanOrEqual(5_600);
    });
  });

  it("keeps instrument sections compact by switching after about two phrases", () => {
    const events = ninePhraseEvents();
    const plan = buildAutomaticInstrumentMix(events, 12_000);

    expect(plan).toHaveLength(5);
    expect(plan.map((segment) => segment.family)).toEqual([
      "piano", "guitar", "trumpet", "drum", "xylophone",
    ]);
    expect(plan.map((segment) => [segment.startMs, segment.endMs])).toEqual([
      [0, 2_800],
      [2_800, 5_600],
      [5_600, 8_400],
      [8_400, 11_200],
      [11_200, 12_000],
    ]);
  });

  it("keeps compact sections while preserving a conspicuous musical rest as a boundary", () => {
    const phraseStarts = [0, 1_400, 2_800, 4_200, 6_400, 7_800];
    const events = phraseStarts.flatMap((startMs, phrase) => [
      note(phrase * 3, startMs),
      note(phrase * 3 + 1, startMs + 180),
      note(phrase * 3 + 2, startMs + 360),
    ]);

    const plan = buildAutomaticInstrumentMix(events, 9_000);

    expect(plan).toHaveLength(3);
    expect(plan.map((segment) => segment.startMs)).toEqual([0, 2_800, 6_400]);
    expect(plan[1].endMs).toBe(6_400);
  });

  it("derives a suitable instrument count from MIDI phrases and program variety", () => {
    const events = ninePhraseEvents().map((event, index) => ({
      ...event,
      program: index < 9 ? 24 : index < 18 ? 56 : 116,
    }));

    expect(recommendedInstrumentCountForMidi(events)).toBe(5);
    expect(buildAutomaticInstrumentMix(events, 12_000)).toHaveLength(5);
  });

  it("never changes instrument before the current MIDI phrase is complete", () => {
    const events = [
      note(0, 0), note(1, 380), note(2, 760), note(3, 1_140),
      note(4, 2_000), note(5, 2_380), note(6, 2_760),
      note(7, 3_700), note(8, 4_080), note(9, 4_460),
    ];
    const automatic = buildAutomaticInstrumentMix(events, 5_000);
    const withExtraSection = addInstrumentMixSegment(automatic, events, 5_000);
    const shortened = updateInstrumentMixSegmentDuration(
      withExtraSection,
      withExtraSection[0].id,
      0.5,
      events,
      5_000,
    );
    const phraseStarts = new Set(buildPhraseInstrumentPlan(events).map((phrase) => phrase.startMs));

    shortened.slice(1).forEach((segment) => expect(phraseStarts.has(segment.startMs)).toBe(true));
    shortened.forEach((segment) => {
      const phrases = buildPhraseInstrumentPlan(events).filter(
        (phrase) => phrase.startMs >= segment.startMs && phrase.startMs < segment.endMs,
      );
      expect(phrases.length).toBeGreaterThanOrEqual(1);
    });
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

  it("lets the last instrument configure its duration by moving the previous phrase boundary", () => {
    const events = ninePhraseEvents();
    const plan = buildAutomaticInstrumentMix(events, 12_000);
    const updated = updateInstrumentMixSegmentDuration(plan, plan.at(-1)!.id, 5, events, 12_000);

    const phraseStarts = new Set(buildPhraseInstrumentPlan(events).map((phrase) => phrase.startMs));
    expect(updated.at(-1)?.endMs).toBe(12_000);
    expect(phraseStarts.has(updated.at(-1)!.startMs)).toBe(true);
    updated.slice(1).forEach((segment, index) => expect(segment.startMs).toBe(updated[index].endMs));
  });

  it("resolves the configured family on both sides of a custom boundary", () => {
    const events = ninePhraseEvents();
    const plan = buildAutomaticInstrumentMix(events, 12_000);
    const base = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const };
    const resolve = createInstrumentMixSettingsResolver(events, plan, () => base);

    expect(resolve(5).instrumentFamily).toBe("piano");
    expect(resolve(6).instrumentFamily).toBe("guitar");
    expect(resolve(12).instrumentFamily).toBe("trumpet");
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
    expect(resolve(5).instrumentFamily).toBe("piano");
    expect(resolve(6).instrumentFamily).toBe("guitar");
  });

  it("changes meshes by configured phrase group without leaving the shared wall-score", () => {
    const events = ninePhraseEvents();
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const };
    const course = buildMarbleCourse(events, settings, 720);
    const expectedHits = wallScoreTwoColumnHits(events, 720);

    expect(course[0].visualStyle).toBe("piano-key");
    expect(course[5].visualStyle).toBe("piano-key");
    expect(course[6].visualStyle).toBe("guitar-body");
    course.forEach((platform, index) => {
      expect(platform.hitX).toBeCloseTo(expectedHits[index].x, 5);
      expect(platform.hitY).toBeCloseTo(expectedHits[index].y, 5);
    });
  });
});
