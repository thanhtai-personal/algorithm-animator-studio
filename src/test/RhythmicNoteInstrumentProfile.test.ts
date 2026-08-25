import { describe, expect, it } from "vitest";
import { instrumentVoiceForPlatform } from "../features/rhythmic-studio/lib/instrumentHitProfiles";
import { NOTE_COLOR_BY_PITCH_CLASS, noteColorForMidi, noteColorsForEvents } from "../features/rhythmic-studio/lib/noteColors";
import type { NoteEvent, PlatformStyle } from "../features/rhythmic-studio/types";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { presetForMidiEvent } from "../features/rhythmic-studio/lib/synthVoices";

function event(midi: number, extra: Partial<NoteEvent> = {}): NoteEvent {
  return { id: `note-${midi}`, timeMs: 100, midi, velocity: 0.8, durationMs: 320, ...extra };
}

describe("canonical MIDI note colors", () => {
  it("assigns twelve distinct pitch-class colors", () => {
    expect(new Set(NOTE_COLOR_BY_PITCH_CLASS).size).toBe(12);
    expect(Array.from({ length: 12 }, (_, index) => noteColorForMidi(60 + index))).toEqual(NOTE_COLOR_BY_PITCH_CLASS);
  });

  it("keeps the same note color across octaves and presets", () => {
    expect(noteColorForMidi(48)).toBe(noteColorForMidi(60));
    expect(noteColorForMidi(60)).toBe(noteColorForMidi(72));
    expect(noteColorForMidi(61)).not.toBe(noteColorForMidi(60));
  });

  it("preserves every color in a chord instead of collapsing to one", () => {
    const colors = noteColorsForEvents([event(60), event(64), event(67)]);
    expect(colors).toEqual([noteColorForMidi(60), noteColorForMidi(64), noteColorForMidi(67)]);
  });

  it("uses the canonical MIDI color for course platforms in every artistic palette", () => {
    const events = [
      { ...event(60), id: "first", timeMs: 200 },
      { ...event(64), id: "second", timeMs: 1_000 },
      { ...event(60), id: "third", timeMs: 1_800 },
    ];
    for (const colorPaletteMode of ["rainbow", "duotone", "key-rainbow"] as const) {
      const platforms = buildMarbleCourse(events, { ...DEFAULT_SETTINGS, colorPaletteMode }, 720);
      expect(platforms.map((platform) => platform.color)).toEqual(events.map((item) => noteColorForMidi(item.midi)));
    }
  });
});

describe("instrument voice selected from the struck platform", () => {
  it.each([
    ["drum-disc", "tom"],
    ["instrument-cymbal", "cymbal"],
    ["gong-disc", "gong"],
    ["flute-pipe", "flute"],
    ["piano-key", "piano"],
    ["xylophone-bar", "xylophone"],
    ["marimba-bar", "marimba"],
    ["vibraphone-bar", "vibraphone"],
    ["boomwhacker-tube", "boomwhacker"],
    ["pluck-pad", "pluck"],
  ] satisfies Array<[PlatformStyle, string]>)
  ("maps %s to %s regardless of the global fallback", (style, expected) => {
    expect(instrumentVoiceForPlatform(style, event(60, { program: 0 }), "piano")).toBe(expected);
  });

  it("uses channel-10 drum notes to select the drum member", () => {
    expect(instrumentVoiceForPlatform("drum-disc", event(36, { isDrum: true }), "piano")).toBe("kick");
    expect(instrumentVoiceForPlatform("drum-disc", event(38, { isDrum: true }), "piano")).toBe("snare");
    expect(instrumentVoiceForPlatform("drum-disc", event(45, { isDrum: true }), "piano")).toBe("tom");
  });

  it("uses MIDI/fallback only for generic platforms", () => {
    expect(instrumentVoiceForPlatform("neon-bar", event(60), "glass")).toBe("glass");
  });

  it("keeps string-family collision voices aligned with their MIDI-aware meshes", () => {
    expect(instrumentVoiceForPlatform("pluck-pad", event(48, { program: 33 }), "piano")).toBe("bass");
    expect(instrumentVoiceForPlatform("instrument-wire", event(71, { program: 48 }), "piano")).toBe("strings");
    expect(instrumentVoiceForPlatform("piano-key", event(60, { program: 4 }), "piano")).toBe("fm");
  });

  it.each([
    ["tube-cylinder", "boomwhacker"],
    ["toy-tube", "boomwhacker"],
    ["toy-peg", "woodblock"],
    ["glass-tempered", "glass"],
    ["metal-rail", "metal-hit"],
    ["dual-rail", "metal-hit"],
    ["pipe-rail", "metal-hit"],
    ["stair-step", "xylophone"],
  ] satisfies Array<[PlatformStyle, string]>)
  ("uses the audible counterpart of the %s mesh instead of the global fallback", (style, expected) => {
    expect(instrumentVoiceForPlatform(style, event(60), "piano")).toBe(expected);
  });
});

describe("General MIDI source arrangement", () => {
  it("preserves the three instrument programs used by SuperMarioMakerTitleTheme.mid", () => {
    expect(presetForMidiEvent(event(60, { program: 4 }))).toBe("fm");
    expect(presetForMidiEvent(event(48, { program: 33 }))).toBe("bass");
    expect(presetForMidiEvent(event(71, { program: 48 }))).toBe("strings");
  });
});
