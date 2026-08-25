import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { instrumentHitForPlatform } from "../features/rhythmic-studio/lib/instrumentHitEvent";
import { noteColorForMidi } from "../features/rhythmic-studio/lib/noteColors";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function note(id: string, midi: number): NoteEvent {
  return { id, timeMs: 500, midi, velocity: 0.8, durationMs: 300 };
}

function platform(index: number, event: NoteEvent, visualStyle: MarblePlatform["visualStyle"], chordClusterId?: number) {
  return { index, event, visualStyle, color: noteColorForMidi(event.midi), chordClusterId } as MarblePlatform;
}

describe("instrument hit event", () => {
  it("carries the actual struck platform style and canonical note color", () => {
    const item = platform(0, note("gong", 67), "gong-disc");
    const hit = instrumentHitForPlatform(0, [item], DEFAULT_SETTINGS, []);
    expect(hit.platformStyle).toBe("gong-disc");
    expect(hit.noteColor).toBe(noteColorForMidi(67));
    expect(hit.event.id).toBe("gong");
  });

  it("preserves every event and note color in a collapsed chord cluster", () => {
    const platforms = [
      platform(0, note("c", 60), "instrument-pad", 4),
      platform(1, note("e", 64), "instrument-pad", 4),
      platform(2, note("g", 67), "instrument-pad", 4),
    ];
    const hit = instrumentHitForPlatform(0, platforms, DEFAULT_SETTINGS, []);
    expect(hit.chordEvents.map((event) => event.id)).toEqual(["c", "e", "g"]);
    expect(hit.chordColors).toEqual([noteColorForMidi(60), noteColorForMidi(64), noteColorForMidi(67)]);
  });
});
