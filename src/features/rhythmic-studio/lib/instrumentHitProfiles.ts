import type { NoteEvent, PlatformStyle, SynthPreset } from "../types";

function drumVoice(event: NoteEvent): SynthPreset {
  if ([35, 36].includes(event.midi)) return "kick";
  if ([38, 39, 40].includes(event.midi)) return "snare";
  if ([42, 44, 46].includes(event.midi)) return "hihat";
  return "tom";
}

export function instrumentVoiceForPlatform(
  style: PlatformStyle,
  event: NoteEvent,
  fallback: SynthPreset,
): SynthPreset {
  if (style === "drum-disc") return drumVoice(event);
  if (style === "instrument-cymbal") return "cymbal";
  if (style === "gong-disc") return "gong";
  if (style === "flute-pipe") return "flute";
  if (style === "piano-key" || style === "piano-keyboard") return "piano";
  if (["instrument-key", "xylophone-key", "xylophone-bar"].includes(style)) return "xylophone";
  if (style === "marimba-bar") return "marimba";
  if (style === "vibraphone-bar") return "vibraphone";
  if (style === "boomwhacker-tube") return "boomwhacker";
  if (style === "pluck-pad" || style === "instrument-wire") return "pluck";
  if (style === "instrument-rail") return "metal-hit";
  if (style === "instrument-pad") return event.isDrum ? drumVoice(event) : "xylophone";
  return fallback;
}
