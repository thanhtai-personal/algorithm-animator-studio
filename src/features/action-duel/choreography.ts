/** Single frame-clock shared by the robot, flying energy dragon, target and SFX. */
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

/** Normalize each attack: hand charges, releases, dragon travels, then collides. */
export const DRAGON_RELEASE = 0.26;
export const DRAGON_HIT = 0.70;
export const DRAGON_END = 0.88;

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
  chargePower: number;
  palmExtension: number;
  enemyX: number;
  enemyY: number;
  enemyStagger: number;
  dragonX: number;
  dragonY: number;
  dragonProgress: number;
  dragonPower: number;
  dragonLength: number;
  hits: number;
  impact: number;
};

/** Pure choreography, suitable for paused preview, seeking and export. */
export function sampleDuelPose(time: number): DuelPose {
  const t = Math.max(0, time);
  let heroX = 202 + Math.sin(t * 1.5) * 1.7;
  let heroY = 289 + Math.sin(t * 5) * 1.4;
  let heroTilt = 0;
  let heroAttack = 0;
  let chargePower = 0;
  let palmExtension = 0;
  let enemyX = 520 + Math.sin(t * 1.3) * 2;
  let enemyY = 289 + Math.sin(t * 4) * 1.2;
  let enemyStagger = 0;
  let dragonX = heroX + 36;
  let dragonY = heroY - 29;
  let dragonProgress = 0;
  let dragonPower = 0;
  let dragonLength = 92;
  let impact = 0;
  let hits = 0;

  for (const attack of DUEL_ATTACKS) {
    const p = (t - attack.at) / attack.duration;
    const contactAt = attack.at + DRAGON_HIT * attack.duration;
    if (t >= contactAt) hits++;

    const recoil = clamp01(1 - (t - contactAt) / .47);
    if (t >= contactAt && recoil > 0) {
      const stagger = recoil * attack.power;
      enemyStagger = Math.max(enemyStagger, stagger);
      enemyX += stagger * 25;
      enemyY -= Math.sin(recoil * Math.PI) * (attack.style === "uppercut" ? 45 : 17);
      impact = Math.max(impact, stagger * stagger);
    }

    if (p < 0 || p > 1) continue;
    // Feet stay near the left side: the robot channels force through an extended palm.
    const windup = ease(p / DRAGON_RELEASE);
    const thrust = ease((p - .15) / .21) * (1 - ease((p - .75) / .23));
    heroX -= 7 * Math.sin(Math.PI * clamp01(p));
    heroY -= 3.5 * windup;
    heroTilt = -.15 * windup + .26 * thrust;
    heroAttack = thrust;
    palmExtension = thrust;
    chargePower = p < DRAGON_RELEASE
      ? Math.sin(Math.PI * clamp01(p / DRAGON_RELEASE)) * attack.power
      : Math.max(0, 1 - (p - DRAGON_RELEASE) / .14) * attack.power;

    if (p >= DRAGON_RELEASE && p <= DRAGON_END) {
      dragonProgress = ease((p - DRAGON_RELEASE) / (DRAGON_HIT - DRAGON_RELEASE));
      const decay = p > DRAGON_HIT ? 1 - ease((p - DRAGON_HIT) / (DRAGON_END - DRAGON_HIT)) : 1;
      dragonPower = attack.power * decay * ease((p - DRAGON_RELEASE) / .08);
      dragonX = heroX + 41 + (enemyX - heroX - 59) * dragonProgress;
      dragonY = heroY - 31 - 10 * Math.sin(dragonProgress * Math.PI)
        + Math.sin(p * 17) * 3;
      dragonLength = 75 + 34 * attack.power;
    }
  }

  return {
    heroX, heroY, heroTilt, heroAttack, chargePower, palmExtension,
    enemyX, enemyY, enemyStagger, dragonX, dragonY,
    dragonProgress, dragonPower, dragonLength, hits, impact,
  };
}
