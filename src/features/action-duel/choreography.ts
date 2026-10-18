/** Shared deterministic attack timeline used by graphics and sound. */
export type DuelAttack = {
  at: number;
  duration: number;
  reach: number;
  power: number;
  style: "dash" | "arc" | "uppercut";
};

export const DUEL_ATTACKS: DuelAttack[] = [
  { at: 0.78, duration: 0.83, reach: 140, power: 0.9, style: "dash" },
  { at: 2.19, duration: 0.72, reach: 74, power: 0.7, style: "arc" },
  { at: 3.57, duration: 0.84, reach: 128, power: 1, style: "uppercut" },
  { at: 5.02, duration: 0.77, reach: 110, power: 0.85, style: "dash" },
  { at: 6.66, duration: 0.81, reach: 66, power: 0.76, style: "arc" },
  { at: 8.17, duration: 0.93, reach: 150, power: 1, style: "dash" },
  { at: 9.83, duration: 0.79, reach: 123, power: 1, style: "uppercut" },
  { at: 11.37, duration: 0.82, reach: 95, power: 0.84, style: "arc" },
  { at: 12.94, duration: 0.84, reach: 143, power: 1, style: "dash" },
  { at: 14.29, duration: 0.67, reach: 100, power: 0.8, style: "arc" },
];

export const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
export const ease = (n: number): number => {
  const v = clamp01(n);
  return v * v * (3 - 2 * v);
};

export type DuelPose = {
  heroX: number;
  heroY: number;
  heroTilt: number;
  heroAttack: number;
  enemyX: number;
  enemyY: number;
  enemyStagger: number;
  slashX: number;
  slashY: number;
  slashPower: number;
  slashPhase: number;
  trail: number;
  hits: number;
  impact: number;
};

/** All motion derives from time alone: scrubbing and video recording are repeatable. */
export function sampleDuelPose(time: number): DuelPose {
  const t = Math.max(0, time);
  let heroX = 206 + Math.sin(t * 1.5) * 2;
  let heroY = 289 + Math.sin(t * 6.5) * 1.3;
  let heroTilt = 0;
  let enemyX = 521 + Math.sin(t * 1.2) * 2;
  let enemyY = 289 + Math.sin(t * 4) * 1.3;
  let enemyStagger = 0;
  let slashX = heroX + 70;
  let slashY = heroY - 23;
  let slashPower = 0;
  let slashPhase = 0;
  let trail = 0;
  let impact = 0;
  let hits = 0;

  for (const event of DUEL_ATTACKS) {
    const p = (t - event.at) / event.duration;
    const hitAt = event.at + event.duration * 0.53;
    if (t >= hitAt) hits++;
    const shock = Math.max(0, 1 - (t - hitAt) / 0.48);
    if (t >= hitAt && shock > 0) {
      enemyStagger = Math.max(enemyStagger, shock * event.power);
      enemyX += shock * event.power * 24;
      enemyY -= Math.sin(shock * Math.PI) * (event.style === "uppercut" ? 49 : 14);
      impact = Math.max(impact, Math.pow(shock, 2));
    }
    if (p < 0 || p > 1) continue;
    const approach = Math.sin(Math.PI * ease(p));
    const burst = Math.sin(Math.PI * clamp01((p - .18) / .63));
    heroX += event.reach * approach;
    heroY -= (event.style === "uppercut" ? 55 : 13) * Math.sin(Math.PI * clamp01(p));
    heroTilt = Math.sin(p * Math.PI * 2) * .28;
    trail = Math.max(0, burst);
    const swipeEnvelope = Math.sin(Math.PI * clamp01((p - .12) / .77));
    slashPower = Math.max(0, swipeEnvelope) * event.power;
    slashPhase = p;
    slashX = heroX + (enemyX - heroX) * ease(p * 1.65);
    slashY = heroY - 26 - (event.style === "uppercut" ? 30 * Math.sin(Math.PI * p) : 0);
  }

  return {
    heroX, heroY, heroTilt, heroAttack: trail, enemyX, enemyY,
    enemyStagger, slashX, slashY, slashPower, slashPhase, trail, hits, impact,
  };
}
