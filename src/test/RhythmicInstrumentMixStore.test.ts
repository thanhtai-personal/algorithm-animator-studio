import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { MIXED_INSTRUMENT_PRESET_ID } from "../features/rhythmic-studio/lib/studioPresets";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function phraseEvents(phraseCount: number): NoteEvent[] {
  return Array.from({ length: phraseCount }, (_, phrase) => [0, 180, 360].map((offset, note) => ({
    id: `store-mix-${phrase}-${note}`,
    timeMs: phrase * 1_400 + offset,
    midi: 60 + (phrase + note) % 12,
    velocity: 0.8,
    durationMs: 120,
  }))).flat();
}

describe("RhythmicStudioStore instrument mix", () => {
  it("creates a MIDI-derived plan on preset selection and regenerates it for a new MIDI", () => {
    const store = new RhythmicStudioStore();
    const firstEvents = phraseEvents(9);
    store.setSource(firstEvents, { type: "midi", name: "first.mid", durationMs: 12_000, eventCount: firstEvents.length }, { key: "status.ready" });
    store.selectPreset(MIXED_INSTRUMENT_PRESET_ID, { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" });

    expect(store.instrumentMixSegments).toHaveLength(3);
    expect(store.instrumentMixSegments.map((segment) => segment.family)).toEqual(["piano", "guitar", "trumpet"]);

    const nextEvents = phraseEvents(6);
    store.setSource(nextEvents, { type: "midi", name: "next.mid", durationMs: 8_000, eventCount: nextEvents.length }, { key: "status.ready" });
    expect(store.instrumentMixSegments).toHaveLength(2);
    expect(store.instrumentMixSegments.at(-1)?.endMs).toBe(store.durationMs);
  });

  it("updates family and duration through store actions", () => {
    const store = new RhythmicStudioStore();
    const events = phraseEvents(9);
    store.setSource(events, { type: "midi", name: "edit.mid", durationMs: 12_000, eventCount: events.length }, { key: "status.ready" });
    store.selectPreset(MIXED_INSTRUMENT_PRESET_ID, { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" });
    const first = store.instrumentMixSegments[0];

    store.setInstrumentMixFamily(first.id, "gong");
    store.setInstrumentMixDuration(first.id, 5.5);

    expect(store.instrumentMixSegments[0].family).toBe("gong");
    expect(store.instrumentMixSegments[0].endMs).toBe(5_600);
  });
});
