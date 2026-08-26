import { TRACK_WIDTH } from '../track/towerCourse';

export const MIN_MARBLES = 10;
export const MAX_MARBLES = 1000;

export function normalizeMarbleCount(count: number) {
  return Math.max(MIN_MARBLES, Math.min(MAX_MARBLES, Math.round(count)));
}

export function marbleRadiusForCount(count: number) {
  const safe = normalizeMarbleCount(count);
  if (safe <= 80) return 0.48;
  if (safe <= 250) return 0.4 - ((safe - 80) / 170) * 0.12;
  return 0.28 - ((safe - 250) / 750) * 0.1;
}

export function marbleStartGrid(count: number) {
  const safe = normalizeMarbleCount(count);
  const radius = marbleRadiusForCount(safe);
  const spacing = radius * 2.12;
  const usableWidth = TRACK_WIDTH - radius * 1.5;
  const lanes = Math.max(2, Math.floor(usableWidth / spacing));
  const rows = Math.ceil(safe / lanes);
  return {
    count: safe,
    radius,
    spacing,
    lanes,
    rows,
    depth: Math.max(4, rows * spacing + 1.5),
  };
}
