import type { PlatformStyle } from "../types";

// Contact is an impulse, not a pause. Keep one short fully-depressed beat so it
// remains readable at 60 fps, then release before the next fast-run strike.
const KEY_HOLD_MS = 12;
const KEY_RELEASE_MS = 96;

export interface InstrumentImpactResponse {
  normalRecoil: number;
  tiltRad: number;
  twistRad: number;
}

interface ResonanceProfile {
  durationMs: number;
  frequencyHz: number;
  decayMs: number;
  recoil: number;
  tiltRad: number;
  twistRad: number;
}

const NO_IMPACT_RESPONSE: InstrumentImpactResponse = {
  normalRecoil: 0,
  tiltRad: 0,
  twistRad: 0,
};

const WOOD_RESPONSE: ResonanceProfile = {
  durationMs: 310,
  frequencyHz: 12.4,
  decayMs: 112,
  recoil: 0.16,
  tiltRad: 0.018,
  twistRad: 0.011,
};

const METAL_BAR_RESPONSE: ResonanceProfile = {
  durationMs: 450,
  frequencyHz: 14.2,
  decayMs: 158,
  recoil: 0.13,
  tiltRad: 0.014,
  twistRad: 0.009,
};

const METAL_DISC_RESPONSE: ResonanceProfile = {
  durationMs: 620,
  frequencyHz: 9.4,
  decayMs: 220,
  recoil: 0.12,
  tiltRad: 0.026,
  twistRad: 0.016,
};

const DRUM_RESPONSE: ResonanceProfile = {
  durationMs: 330,
  frequencyHz: 11.1,
  decayMs: 126,
  recoil: 0.18,
  tiltRad: 0.013,
  twistRad: 0.008,
};

const TUBE_RESPONSE: ResonanceProfile = {
  durationMs: 360,
  frequencyHz: 10.8,
  decayMs: 138,
  recoil: 0.15,
  tiltRad: 0.017,
  twistRad: 0.012,
};

function resonanceProfile(style: PlatformStyle): ResonanceProfile | null {
  if (style === "piano-key" || style === "piano-keyboard") return null;
  if (style === "instrument-cymbal" || style === "gong-disc") return METAL_DISC_RESPONSE;
  if (style === "vibraphone-bar" || style === "metallophone-plate" || style.includes("rail") || style === "instrument-wire") {
    return METAL_BAR_RESPONSE;
  }
  if (style === "drum-disc" || style === "instrument-pad") return DRUM_RESPONSE;
  if (style.includes("tube") || style === "toy-peg" || style === "flute-pipe") return TUBE_RESPONSE;
  if (
    style === "instrument-key"
    || style === "xylophone-key"
    || style === "xylophone-bar"
    || style === "marimba-bar"
    || style === "pluck-pad"
  ) return WOOD_RESPONSE;
  return null;
}

/** Deterministic piano-key travel shared by live preview and exported frames. */
export function instrumentKeyPressAtTime(hitTimeMs: number, timeMs: number) {
  const age = timeMs - hitTimeMs;
  if (age < 0 || age >= KEY_HOLD_MS + KEY_RELEASE_MS) return 0;
  if (age <= KEY_HOLD_MS) return 1;
  const remaining = 1 - (age - KEY_HOLD_MS) / KEY_RELEASE_MS;
  return remaining * remaining * (3 - 2 * remaining);
}

/** Small deterministic resonance. The support stays fixed; only the struck body uses this response. */
export function instrumentImpactResponseAtTime(
  style: PlatformStyle,
  hitTimeMs: number,
  timeMs: number,
  index: number,
): InstrumentImpactResponse {
  const profile = resonanceProfile(style);
  const ageMs = timeMs - hitTimeMs;
  if (!profile || ageMs <= 0 || ageMs >= profile.durationMs) return NO_IMPACT_RESPONSE;

  const phase = Math.PI * 2 * profile.frequencyHz * ageMs / 1_000;
  const tail = Math.min(1, (profile.durationMs - ageMs) / 72);
  const envelope = Math.exp(-ageMs / profile.decayMs) * tail;
  const direction = index % 2 === 0 ? 1 : -1;

  return {
    normalRecoil: profile.recoil * (1 - Math.cos(phase)) * 0.5 * envelope,
    tiltRad: Math.sin(phase) * profile.tiltRad * envelope * direction,
    twistRad: Math.sin(phase * 0.83) * profile.twistRad * envelope * -direction,
  };
}
