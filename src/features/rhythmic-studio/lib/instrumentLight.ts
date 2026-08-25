export interface InstrumentLightHit {
  timeMs: number;
  color: string;
}

export interface InstrumentLightState {
  active: boolean;
  color: string;
  intensity: number;
}

const FLASH_HOLD_MS = 120;
const SETTLE_MS = 300;
export const LATCHED_INSTRUMENT_LIGHT = 0.72;

export function instrumentLightAtTime(hitTimeMs: number, timeMs: number, color: string): InstrumentLightState {
  const age = timeMs - hitTimeMs;
  if (age < 0) return { active: false, color, intensity: 0 };
  if (age <= FLASH_HOLD_MS) return { active: true, color, intensity: 1 };
  if (age < FLASH_HOLD_MS + SETTLE_MS) {
    const progress = (age - FLASH_HOLD_MS) / SETTLE_MS;
    const eased = 1 - (1 - progress) * (1 - progress);
    return { active: true, color, intensity: 1 + (LATCHED_INSTRUMENT_LIGHT - 1) * eased };
  }
  return { active: true, color, intensity: LATCHED_INSTRUMENT_LIGHT };
}

export function activeInstrumentLight(hits: InstrumentLightHit[], timeMs: number): InstrumentLightState {
  const latest = [...hits].reverse().find((hit) => hit.timeMs <= timeMs);
  return latest
    ? instrumentLightAtTime(latest.timeMs, timeMs, latest.color)
    : { active: false, color: "#000000", intensity: 0 };
}
