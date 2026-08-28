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
  { id: "launch-follow", from: 0, to: 0.12, behind: 13, lift: 7.5, side: 5.5, lookAhead: 7, fov: 49 },
  { id: "s-bend-sweep", from: 0.12, to: 0.27, behind: 11, lift: 8.5, side: -6.5, lookAhead: 6, fov: 50 },
  { id: "ridge-follow", from: 0.27, to: 0.41, behind: 12, lift: 8, side: 6, lookAhead: 6, fov: 49 },
  { id: "choice-gates", from: 0.41, to: 0.55, behind: 10, lift: 9, side: -6, lookAhead: 5, fov: 50 },
  { id: "switchback-chase", from: 0.55, to: 0.69, behind: 11, lift: 9.5, side: 6.5, lookAhead: 5, fov: 51 },
  { id: "slalom-chase", from: 0.69, to: 0.83, behind: 10, lift: 8, side: -6.5, lookAhead: 6, fov: 49 },
  { id: "final-slope-chase", from: 0.83, to: 0.95, behind: 12, lift: 7.5, side: 5, lookAhead: 7, fov: 48 },
  { id: "finish-front", from: 0.95, to: 1, behind: -9, lift: 7, side: 3.5, lookAhead: 1, fov: 46 },
];

export function olympicRoadCameraShot(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  return OLYMPIC_ROAD_CAMERA_SHOTS.find((shot) => clamped >= shot.from && clamped < shot.to)
    ?? OLYMPIC_ROAD_CAMERA_SHOTS[OLYMPIC_ROAD_CAMERA_SHOTS.length - 1];
}

export function olympicRoadCameraAnchorProgress(shot: OlympicRoadCameraShot) {
  return shot.from + (shot.to - shot.from) * 0.52;
}
