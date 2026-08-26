export type RaceCameraShot = {
  behind: number;
  lift: number;
  side: number;
  fov: number;
};

const SHOTS: Record<string, RaceCameraShot> = {
  start: { behind: 8.6, lift: 4.4, side: 5, fov: 49 },
  switchback: { behind: 6.4, lift: 6.4, side: 7.2, fov: 54 },
  spinner: { behind: 5, lift: 5.2, side: 6.5, fov: 52 },
  hairpin: { behind: 6.4, lift: 6.4, side: 7.2, fov: 54 },
  chimes: { behind: 4.8, lift: 4.8, side: 6.4, fov: 51 },
  piano: { behind: 10, lift: 3.2, side: 1.2, fov: 47 },
  spiral: { behind: 6.2, lift: 6.4, side: 7.2, fov: 54 },
  tunnel: { behind: 7, lift: 2.8, side: 0.8, fov: 50 },
  chaos: { behind: 4.8, lift: 5.2, side: 6, fov: 53 },
  finish: { behind: 7.2, lift: 4.8, side: 8.4, fov: 47 },
};

export function cameraShotForSection(section: string, timelineSeconds: number, racing: boolean): RaceCameraShot {
  const base = SHOTS[section] ?? SHOTS.start;
  if (racing || section !== "start") return { ...base };

  // A small deterministic crane move keeps exported countdown footage alive.
  // It uses the physics timeline, so preview and frame-by-frame export match.
  return {
    ...base,
    side: base.side + Math.sin(timelineSeconds * 0.78) * 0.9,
    lift: base.lift + (Math.cos(timelineSeconds * 0.72) - 1) * 0.3,
  };
}
