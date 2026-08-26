import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { presetObstaclePlan } from "../features/rhythmic-studio/engine/presetObstaclePlan";
import {
  buildPhraseInstrumentPlan,
  createPhraseInstrumentSettingsResolver,
} from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function note(index: number, timeMs: number): NoteEvent {
  return { id: `phrase-instrument-${index}`, timeMs, midi: 60 + (index % 12), velocity: 0.8, durationMs: 120 };
}

describe("mixed instruments follow musical phrases", () => {
  const events = [
    note(0, 0), note(1, 180), note(2, 360), note(3, 540),
    note(4, 1_400), note(5, 1_590), note(6, 1_780), note(7, 1_970),
    note(8, 2_850), note(9, 3_050), note(10, 3_250),
  ];

  it("changes instrument only at phrase boundaries", () => {
    const plan = buildPhraseInstrumentPlan(events);
    expect(plan).toHaveLength(3);
    expect(plan.map((segment) => [segment.startIndex, segment.endIndex])).toEqual([[0, 3], [4, 7], [8, 10]]);
    expect(new Set(plan.map((segment) => segment.family)).size).toBe(3);
  });

  it("keeps every note in one phrase on one exact instrument even in corridor layout", () => {
    const base = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const, instrumentLayout: "corridor" as const };
    const resolve = createPhraseInstrumentSettingsResolver(events, () => base);

    const firstFamily = resolve(0).instrumentFamily;
    expect(firstFamily).not.toBe("mixed");
    expect(resolve(1).instrumentFamily).toBe(firstFamily);
    expect(resolve(2).instrumentFamily).toBe(firstFamily);
    expect(resolve(3).instrumentFamily).toBe(firstFamily);
    expect(resolve(4).instrumentFamily).not.toBe(firstFamily);

    const firstStyles = [0, 1, 2, 3].map((index) => presetObstaclePlan(index, resolve(index))?.style);
    expect(new Set(firstStyles).size).toBe(1);
  });
});
