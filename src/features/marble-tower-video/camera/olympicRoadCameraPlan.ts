export type OlympicRoadCameraShot = {
  id: string;
  from: number;
  to: number;
  behind: number;
  lift: number;
  side: number;
  lookAhead: number;
  fov: number;
};

export const OLYMPIC_ROAD_CAMERA_SHOTS: readonly OlympicRoadCameraShot[] = [
  { id: "launch-crane", from: 0, to: 0.1, behind: 10, lift: 9, side: 4, lookAhead: 4, fov: 48 },
  { id: "hairpin-overhead", from: 0.1, to: 0.27, behind: 1, lift: 16, side: 9, lookAhead: 2, fov: 54 },
  { id: "spiral-lockoff", from: 0.27, to: 0.49, behind: 0, lift: 18, side: 0, lookAhead: 0, fov: 56 },
  { id: "choice-gates", from: 0.49, to: 0.58, behind: 7, lift: 11, side: -7, lookAhead: 4, fov: 52 },
  { id: "switchback-pan", from: 0.58, to: 0.74, behind: 2, lift: 15, side: 8, lookAhead: 2, fov: 55 },
  { id: "slalom-chase", from: 0.74, to: 0.88, behind: 7, lift: 10, side: -8, lookAhead: 4, fov: 50 },
  { id: "final-chute-front", from: 0.88, to: 0.95, behind: -8, lift: 10, side: 5, lookAhead: 1, fov: 47 },
  { id: "finish-podium", from: 0.95, to: 1, behind: -11, lift: 8, side: 3, lookAhead: 0, fov: 46 },
];

export function olympicRoadCameraShot(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  return OLYMPIC_ROAD_CAMERA_SHOTS.find((shot) => clamped >= shot.from && clamped < shot.to)
    ?? OLYMPIC_ROAD_CAMERA_SHOTS[OLYMPIC_ROAD_CAMERA_SHOTS.length - 1];
}
