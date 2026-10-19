/** Source-frame-derived reference values in the original 360x640 coordinate space. */
export const FAN_HUB = { x: 180, y: 36 } as const;
export const FAN_BLADE_ANGLES = [0, 120, 240] as const;

// Unwrapped angular travel. Long holds and rapid passes come from source frames
// 0, 90, 114, 132-148, 182-194 and 245-272. Angles are art-directed
// approximations, NOT pixel-tracked ground truth.
const ANGLE_KEYS = [
  [0, 60], [3.40, 60], [3.80, 120], [4.03, 120],
  [4.22, 212], [4.40, 240], [4.55, 360], [4.66, 360],
  [4.92, 450], [5.65, 450], [6.07, 480], [6.22, 480],
  [6.47, 525], [6.86, 600], [7.15, 655], [8.05, 655],
  [8.33, 720], [8.57, 720], [9.10, 775], [9.867, 775],
] as const;

const easing = (u: number) => {
  const t = Math.max(0, Math.min(1, u));
  return t * t * (3 - 2 * t);
};

/** Deterministic degrees for Remotion seeks and exports (never accumulated by frame). */
export function getFashionFanAngle(seconds: number): number {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (time <= ANGLE_KEYS[0][0]) return ANGLE_KEYS[0][1];
  for (let i = 1; i < ANGLE_KEYS.length; i += 1) {
    const [stop, angle] = ANGLE_KEYS[i];
    const [start, previous] = ANGLE_KEYS[i - 1];
    if (time <= stop) return previous + (angle - previous) * easing((time - start) / (stop - start));
  }
  return ANGLE_KEYS[ANGLE_KEYS.length - 1][1];
}

export type FashionFanMotion = {
  angleDegrees: number;
  blurStrength: number;
  trails: readonly number[];
};

/** Temporal trail samples are deliberately behind the current blade, not duplicate foregrounds. */
export function getFashionFanMotion(seconds: number): FashionFanMotion {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const angleDegrees = getFashionFanAngle(time);
  const displacement = angleDegrees - getFashionFanAngle(Math.max(0, time - 1 / 30));
  const blurStrength = Math.min(1, Math.max(0, displacement / 6));
  return {
    angleDegrees,
    blurStrength,
    trails: [1, 2, 3].map((n) => getFashionFanAngle(Math.max(0, time - n / 90))),
  };
}
