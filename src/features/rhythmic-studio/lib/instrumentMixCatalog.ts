import type { ConfigurableInstrumentFamily, InstrumentMixSegment, NoteEvent } from "../types";

export const PHRASE_INSTRUMENT_SEQUENCE: readonly ConfigurableInstrumentFamily[] = [
  "piano",
  "guitar",
  "trumpet",
  "drum",
  "xylophone",
  "marimba",
  "gong",
  "bronze-drum",
  "vibraphone",
  "boomwhacker",
  "pluck",
  "metallophone",
  "flute",
] as const;

export const KOROBEINIKI_INSTRUMENT_MIX_SELECTION = "korobeiniki-tubes" as const;
export type InstrumentMixSelection = ConfigurableInstrumentFamily
  | typeof KOROBEINIKI_INSTRUMENT_MIX_SELECTION;
export const INSTRUMENT_MIX_SELECTIONS: readonly InstrumentMixSelection[] = [
  ...PHRASE_INSTRUMENT_SEQUENCE,
  KOROBEINIKI_INSTRUMENT_MIX_SELECTION,
];

export function instrumentMixSelectionForSegment(segment: InstrumentMixSegment): InstrumentMixSelection {
  return segment.variant === KOROBEINIKI_INSTRUMENT_MIX_SELECTION
    ? KOROBEINIKI_INSTRUMENT_MIX_SELECTION
    : segment.family;
}

function midiFamilyHint(event: NoteEvent): ConfigurableInstrumentFamily {
  if (event.isDrum || event.channel === 9) return "drum";
  const program = Math.max(0, Math.min(127, event.program ?? 0));
  if (program <= 7) return "piano";
  if (program <= 15) return program <= 11 ? "vibraphone" : "marimba";
  if (program >= 24 && program <= 31) return "guitar";
  if (program >= 56 && program <= 63) return "trumpet";
  if (program >= 64 && program <= 79) return "flute";
  if (program >= 112 && program <= 115) return "gong";
  if (program >= 116 && program <= 119) return "bronze-drum";
  if (program >= 8 && program <= 23) return "metallophone";
  if (program >= 32 && program <= 55) return "pluck";
  return "boomwhacker";
}

export function midiInstrumentHints(events: readonly NoteEvent[]) {
  const hints: ConfigurableInstrumentFamily[] = [];
  for (const event of events) {
    const family = midiFamilyHint(event);
    if (!hints.includes(family)) hints.push(family);
  }
  return hints;
}

export function instrumentFamiliesForMidi(events: readonly NoteEvent[], count: number) {
  const requested = Math.max(1, Math.floor(count));
  const candidates = [...midiInstrumentHints(events), ...PHRASE_INSTRUMENT_SEQUENCE];
  const unique = candidates.filter((family, index) => candidates.indexOf(family) === index);
  return Array.from({ length: requested }, (_, index) => unique[index % unique.length]);
}
