import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { PlatformStyle } from "../types";
import { noteColorForMidi } from "./noteColors";

const NOTE_LIT_STYLES = new Set<PlatformStyle>([
  "instrument-key",
  "instrument-cymbal",
  "instrument-rail",
  "instrument-pad",
  "instrument-wire",
  "boomwhacker-tube",
  "xylophone-key",
  "xylophone-bar",
  "piano-key",
  "piano-keyboard",
  "marimba-bar",
  "pluck-pad",
  "vibraphone-bar",
  "drum-disc",
  "gong-disc",
  "flute-pipe",
]);

export function isNoteLitInstrumentStyle(style: PlatformStyle) {
  return NOTE_LIT_STYLES.has(style);
}

export function noteLightColorsForPlatform(platform: MarblePlatform, platforms: MarblePlatform[]) {
  if (platform.chordClusterId === undefined) return [noteColorForMidi(platform.event.midi)];
  return platforms
    .filter((candidate) => candidate.chordClusterId === platform.chordClusterId)
    .map((candidate) => noteColorForMidi(candidate.event.midi));
}
