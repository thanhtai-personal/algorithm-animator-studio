export type RaceCameraShot = {
  behind: number;
  lift: number;
  side: number;
  fov: number;
};

const SHOTS: Record<string, RaceCameraShot> = {
  start: { behind: 10.5, lift: 7.5, side: 7, fov: 52 },
  switchback: { behind: 8.5, lift: 9.5, side: 10.5, fov: 58 },
  spinner: { behind: 8, lift: 7.5, side: 9.5, fov: 55 },
  hairpin: { behind: 8, lift: 10, side: 10.5, fov: 58 },
  chimes: { behind: 7.5, lift: 7, side: 9, fov: 55 },
  piano: { behind: 13, lift: 5.5, side: 3, fov: 52 },
  spiral: { behind: 8, lift: 10, side: 11, fov: 58 },
  tunnel: { behind: 10, lift: 4, side: 3, fov: 53 },
  chaos: { behind: 7, lift: 8, side: 10, fov: 56 },
  finish: { behind: 8, lift: 7, side: 11, fov: 50 },
};

export function cameraAnchorProgress(section: { from: number; to: number }) {
  return section.from + (section.to - section.from) * 0.52;
}

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
