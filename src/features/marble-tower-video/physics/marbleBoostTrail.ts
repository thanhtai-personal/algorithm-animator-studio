export const PIANO_TRAIL_SECONDS = 0.9;

export function pianoTrailStrength(trailUntil: number, now: number) {
  return Math.max(0, Math.min(1, (trailUntil - now) / PIANO_TRAIL_SECONDS));
}
