import type { NoteEvent, PlatformStyle, StudioSettings } from "../types";

function drumStyle(midi: number): PlatformStyle {
  return [42, 44, 46, 49, 51, 52, 55, 57, 59].includes(midi)
    ? "instrument-cymbal"
    : "drum-disc";
}

/** Selects a visible instrument family from the same General MIDI program used by audio. */
export function midiInstrumentVisualStyle(
  event: NoteEvent,
  settings: Pick<StudioSettings, "instrumentFamily" | "midiInstrumentMode">,
): PlatformStyle | null {
  if (settings.instrumentFamily !== "auto" || settings.midiInstrumentMode !== "auto") return null;
  if (event.isDrum) return drumStyle(event.midi);
  if (event.program === undefined) return null;

  const program = Math.max(0, Math.min(127, event.program));
  if (program <= 7) return "piano-key";
  if (program <= 11) return "vibraphone-bar";
  if (program <= 15) return "marimba-bar";
  if (program <= 23) return "piano-key";
  if (program <= 39) return "pluck-pad";
  if (program <= 55) return "instrument-wire";
  if (program <= 63) return "instrument-rail";
  if (program <= 79) return "flute-pipe";
  if (program <= 95) return "instrument-key";
  if (program <= 111) return "vibraphone-bar";
  return "instrument-pad";
}
