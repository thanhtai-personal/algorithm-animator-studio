/** A deterministic animation score shared by the fight render and the soundtrack. */
export type DuelAttack = {
  at: number;
  duration: number;
  power: number;
  style: "straight" | "lifting";
};

/** Staggered strikes keep the emphasis on one fluid Kháng Long Hữu Hối palm sequence. */
export const DUEL_ATTACKS: DuelAttack[] = [
  { at: 0.72, duration: 0.92, power: 0.98, style: "straight" },
  { at: 2.18, duration: 0.88, power: 0.82, style: "straight" },
  { at: 3.62, duration: 0.94, power: 1, style: "lifting" },
  { at: 5.08, duration: 0.86, power: 0.9, style: "straight" },
  { at: 6.68, duration: 0.9, power: 0.86, style: "straight" },
  { at: 8.19, duration: 0.95, power: 1, style: "lifting" },
  { at: 9.84, duration: 0.88, power: 0.97, style: "straight" },
  { at: 11.38, duration: 0.92, power: 0.9, style: "straight" },
  { at: 12.97, duration: 0.9, power: 1, style: "lifting" },
  { at: 14.30, duration: 0.71, power: 0.88, style: "straight" },
];

export const DRAGON_CHARGE_END = 0.26;
export const DRAGON_FLIGHT_END = 0.64;
export const DRAGON_WRAP_END = 0.83;
export const DRAGON_END = 0.94;
// Backwards compatible names used by the original soundtrack.
export const DRAGON_RELEASE = DRAGON_CHARGE_END;
export const DRAGON_HIT = DRAGON_FLIGHT_END;

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => {
  const p = clamp01(n);
  return p * p * (3 - 2 * p);
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
  enemyTilt: number;
  enemyStagger: number;
  dragonStage: "none" | "coil" | "flight" | "wrap" | "fade";
  dragonX: number;
  dragonY: number;
  dragonProgress: number;
  dragonPower: number;
  dragonLength: number;
  dragonWrap: number;
  dragonAngle: number;
  hits: number;
  impact: number;
};

/**
 * Body roots remain planted; dragon travels from the palms in a straight burst,
 * coils around the skeleton for a short impact, then dissolves. The skeleton
 * absorbs force, leans back, lifts and slides with ease-out recovery.
 */
export function sampleDuelPose(time: number): DuelPose {
  const t = Math.max(0, time);
  const heroBaseX = 203;
  const heroBaseY = 289;
  const enemyBaseX = 444;
  const enemyBaseY = 289;
  let heroX = heroBaseX + Math.sin(t * 1.5) * 1.3;
  let heroY = heroBaseY;
  let heroTilt = 0;
  let heroAttack = 0;
  let chargePower = 0;
  let palmExtension = 0;
  let enemyX = enemyBaseX + Math.sin(t * 1.15) * 1.4;
  let enemyY = enemyBaseY + Math.sin(t * 3.8) * .9;
  let enemyTilt = 0;
  let enemyStagger = 0;
  let dragonStage: DuelPose["dragonStage"] = "none";
  let dragonX = heroBaseX + 30;
  let dragonY = heroBaseY - 23;
  let dragonProgress = 0;
  let dragonPower = 0;
  let dragonLength = 120;
  let dragonWrap = 0;
  let dragonAngle = Math.PI;
  let hits = 0;
  let impact = 0;

  for (const attack of DUEL_ATTACKS) {
    const p = (t - attack.at) / attack.duration;
    if (p >= DRAGON_FLIGHT_END) hits++;
    if (p < 0 || p >= 1) continue;
    const windup = ease(p / DRAGON_CHARGE_END);
    const thrust = ease((p - .18) / .18) * (1 - ease((p - .70) / .15));
    heroX = heroBaseX - 4.5 * windup + 4 * thrust;
    heroY = heroBaseY + 1.5 * windup - 2 * thrust;
    heroTilt = -.06 * windup + .11 * thrust;
    heroAttack = thrust;
    palmExtension = thrust;
    chargePower = p < DRAGON_CHARGE_END
      ? Math.sin(Math.PI * p / DRAGON_CHARGE_END) * attack.power
      : (1 - ease((p - DRAGON_CHARGE_END) / .11)) * attack.power;

    if (p < DRAGON_CHARGE_END && p >= .06) {
      dragonStage = "coil";
      const phase = ease((p - .06) / (DRAGON_CHARGE_END - .06));
      dragonX = heroX + 31 + Math.cos(t * 24) * 9;
      dragonY = heroY - 24 + Math.sin(t * 24) * 9;
      dragonLength = 80 + 22 * phase;
      dragonPower = attack.power * (.3 + .55 * Math.sin(Math.PI * phase));
      dragonAngle = t * 24;
    } else if (p >= DRAGON_CHARGE_END && p < DRAGON_FLIGHT_END) {
      dragonStage = "flight";
      const flight = ease((p - DRAGON_CHARGE_END) / (DRAGON_FLIGHT_END - DRAGON_CHARGE_END));
      dragonProgress = flight;
      dragonPower = attack.power;
      dragonLength = 135;
      dragonX = heroX + 31 + (enemyBaseX - heroX - 53) * flight;
      dragonY = heroY - 23 - 9 * Math.sin(Math.PI * flight);
      dragonAngle = 0;
    } else if (p >= DRAGON_FLIGHT_END && p < DRAGON_WRAP_END) {
      dragonStage = "wrap";
      const wrap = ease((p - DRAGON_FLIGHT_END) / (DRAGON_WRAP_END - DRAGON_FLIGHT_END));
      dragonProgress = 1;
      dragonWrap = wrap;
      dragonPower = attack.power * (1 - .16 * wrap);
      dragonLength = 100;
      // Approach the left side, arc above the skull, then curl around its body.
      const angle = Math.PI + wrap * Math.PI * 1.75;
      dragonAngle = angle;
      dragonX = enemyBaseX + Math.cos(angle) * 30;
      dragonY = enemyBaseY - 33 + Math.sin(angle) * 22;
    } else if (p >= DRAGON_WRAP_END && p < DRAGON_END) {
      dragonStage = "fade";
      const fade = 1 - ease((p - DRAGON_WRAP_END) / (DRAGON_END - DRAGON_WRAP_END));
      dragonProgress = 1;
      dragonWrap = 1;
      dragonPower = fade * attack.power;
      dragonLength = 70 + 30 * fade;
      dragonAngle = Math.PI + Math.PI * 1.75;
      dragonX = enemyBaseX + 10 + 22 * (1 - fade);
      dragonY = enemyBaseY - 38;
    }

    if (p >= DRAGON_FLIGHT_END) {
      const recoil = clamp01((p - DRAGON_FLIGHT_END) / (1 - DRAGON_FLIGHT_END));
      const impulse = Math.sin(Math.PI * Math.min(1, recoil / .72));
      const displacement = ease(recoil / .36) * (1 - ease((recoil - .62) / .38));
      enemyStagger = attack.power * impulse;
      enemyTilt = .39 * impulse;
      enemyX = enemyBaseX + 52 * attack.power * displacement;
      enemyY = enemyBaseY - (attack.style === "lifting" ? 30 : 15)
        * Math.sin(Math.PI * Math.min(1, recoil / .8));
      impact = attack.power * impulse;
      if (dragonStage === "wrap" || dragonStage === "fade") {
        dragonX += enemyX - enemyBaseX;
        dragonY += enemyY - enemyBaseY;
      }
    }
  }

  return {
    heroX, heroY, heroTilt, heroAttack, chargePower, palmExtension,
    enemyX, enemyY, enemyTilt, enemyStagger, dragonStage,
    dragonX, dragonY, dragonProgress, dragonPower, dragonLength,
    dragonWrap, dragonAngle, hits, impact,
  };
}
