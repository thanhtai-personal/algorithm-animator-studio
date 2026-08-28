import { describe, expect, it } from "vitest";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { isNoteLitInstrumentStyle, noteLightColorsForPlatform } from "../features/rhythmic-studio/lib/instrumentLightsModel";
import { noteColorForMidi } from "../features/rhythmic-studio/lib/noteColors";

function platform(index: number, midi: number, chordClusterId?: number) {
  return {
    index,
    chordClusterId,
    color: noteColorForMidi(midi),
    event: { id: String(index), timeMs: 100, midi, velocity: 0.8, durationMs: 200 },
  } as MarblePlatform;
}

describe("instrument LED model", () => {
  it.each(["drum-disc", "instrument-cymbal", "gong-disc", "flute-pipe", "trumpet-horn", "guitar-body", "bronze-drum", "piano-key", "xylophone-bar", "metallophone-plate"] as const)(
    "marks %s as a note-lit instrument",
    (style) => expect(isNoteLitInstrumentStyle(style)).toBe(true),
  );

  it("splits a chord light into one exact color segment per note", () => {
    const platforms = [platform(0, 60, 7), platform(1, 64, 7), platform(2, 67, 7)];
    expect(noteLightColorsForPlatform(platforms[0], platforms)).toEqual([
      noteColorForMidi(60),
      noteColorForMidi(64),
      noteColorForMidi(67),
    ]);
  });
});
