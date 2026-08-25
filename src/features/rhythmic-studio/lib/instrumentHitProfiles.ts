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
  const program = Math.max(0, Math.min(127, event.program ?? 0));
  if (style === "drum-disc") return drumVoice(event);
  if (style === "instrument-cymbal") return "cymbal";
  if (style === "gong-disc") return "gong";
  if (style === "flute-pipe") return "flute";
  if (style === "piano-key" || style === "piano-keyboard") return program >= 4 && program <= 7 ? "fm" : "piano";
  if (["instrument-key", "xylophone-key", "xylophone-bar"].includes(style)) return "xylophone";
  if (style === "marimba-bar") return "marimba";
  if (style === "vibraphone-bar" || style === "metallophone-plate") return "vibraphone";
  if (style === "boomwhacker-tube") return "boomwhacker";
  if (style === "pluck-pad" || style === "instrument-wire") {
    if (program >= 32 && program <= 39) return "bass";
    if (program >= 40 && program <= 55) return "strings";
    return "pluck";
  }
  if (["instrument-rail", "metal-rail", "dual-rail", "pipe-rail"].includes(style)) return "metal-hit";
  if (style === "instrument-pad") return event.isDrum ? drumVoice(event) : "xylophone";
  if (["tube-cylinder", "toy-tube"].includes(style)) return "boomwhacker";
  if (style === "toy-peg") return "woodblock";
  if (style === "glass" || style.startsWith("glass-")) return "glass";
  if (style === "stair-step") return "xylophone";
  return fallback;
}
