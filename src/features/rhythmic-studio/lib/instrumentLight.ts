export interface InstrumentLightHit {
  timeMs: number;
  color: string;
}

export interface InstrumentLightState {
  active: boolean;
  color: string;
  intensity: number;
}

const ATTACK_MS = 35;
const HOLD_MS = 75;
const DECAY_MS = 300;
const TOTAL_MS = ATTACK_MS + HOLD_MS + DECAY_MS;

export function instrumentLightAtTime(hitTimeMs: number, timeMs: number, color: string): InstrumentLightState {
  const age = timeMs - hitTimeMs;
  if (age < 0 || age >= TOTAL_MS) return { active: false, color, intensity: 0 };
  if (age < ATTACK_MS) return { active: true, color, intensity: age / ATTACK_MS };
  if (age < ATTACK_MS + HOLD_MS) return { active: true, color, intensity: 1 };
  const decay = 1 - (age - ATTACK_MS - HOLD_MS) / DECAY_MS;
  return { active: true, color, intensity: Math.max(0, decay * decay) };
}

export function activeInstrumentLight(hits: InstrumentLightHit[], timeMs: number): InstrumentLightState {
  const latest = [...hits].reverse().find((hit) => hit.timeMs <= timeMs);
  return latest
    ? instrumentLightAtTime(latest.timeMs, timeMs, latest.color)
    : { active: false, color: "#000000", intensity: 0 };
}
