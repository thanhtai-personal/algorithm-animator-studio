import type { NoteEvent } from "../types";

export const NOTE_COLOR_BY_PITCH_CLASS = [
  "#ff5d68",
  "#ff7a45",
  "#ff9f3f",
  "#ffc247",
  "#e6dc52",
  "#70d66b",
  "#42d5a8",
  "#42cfe8",
  "#4ca4ff",
  "#6f7cff",
  "#a86df2",
  "#e266d3",
] as const;

export function noteColorForMidi(midi: number) {
  const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
  return NOTE_COLOR_BY_PITCH_CLASS[pitchClass];
}

export function noteColorsForEvents(events: NoteEvent[]) {
  return events.map((event) => noteColorForMidi(event.midi));
}
