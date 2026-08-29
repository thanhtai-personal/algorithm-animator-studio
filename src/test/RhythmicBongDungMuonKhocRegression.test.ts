import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { buildAutomaticInstrumentMix } from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import { presetForMidiEvent } from "../features/rhythmic-studio/lib/synthVoices";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";

const MIDI_PATH = "C:\\Users\\Kai.Tran\\Music\\midi\\Bong Dung Muon Khoc_Khac.mid";

describe("Bong Dung Muon Khoc_Khac.mid regression", () => {
  it("drives collisions from the lead melody when accompaniment shares the same onset", () => {
    const bytes = readFileSync(MIDI_PATH);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const sourceEvents = parseMidi(buffer);
    const timeline = buildRhythmicTimeline(sourceEvents, DEFAULT_SETTINGS);
    const leadOnsets = new Set(
      sourceEvents.filter((event) => event.channel === 0).map((event) => event.timeMs),
    );
    const melodyCollisions = timeline.filter((event) => leadOnsets.has(event.timeMs));

    expect(sourceEvents).toHaveLength(431);
    expect(timeline).toHaveLength(169);
    expect(melodyCollisions.length).toBeGreaterThan(70);
    expect(melodyCollisions.every((event) => event.channel === 0)).toBe(true);
  });

  it("maps the program-71 melody to the same wind family in audio and automatic mixing", () => {
    const bytes = readFileSync(MIDI_PATH);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const timeline = buildRhythmicTimeline(parseMidi(buffer), DEFAULT_SETTINGS);
    const melody = timeline.find((event) => event.channel === 0);

    expect(melody?.program).toBe(71);
    expect(melody && presetForMidiEvent(melody)).toBe("flute");
    expect(buildAutomaticInstrumentMix(timeline).map((segment) => segment.family)).toEqual([
      "piano",
      "flute",
      "pluck",
      "drum",
    ]);
  });
});
