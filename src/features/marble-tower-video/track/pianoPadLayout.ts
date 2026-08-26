import * as THREE from "three";
import { SPECIALS, TRACK_WIDTH } from "./towerCourse";

export type PianoPadLayoutItem = {
  index: number;
  progress: number;
  width: number;
  depth: number;
  lateral: number;
  boostDeltaV: number;
};

function seeded01(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export const PIANO_PAD_LAYOUT: PianoPadLayoutItem[] = Array.from({ length: 12 }, (_, index) => {
  const width = THREE.MathUtils.lerp(2.15, 3.2, seeded01(index * 3 + 1));
  const margin = 0.56;
  const maxCenterOffset = Math.max(0, TRACK_WIDTH / 2 - width / 2 - margin);
  return {
    index,
    progress: THREE.MathUtils.lerp(SPECIALS.pianoStart, SPECIALS.pianoEnd, (index + 0.5) / 12),
    width,
    depth: THREE.MathUtils.lerp(0.82, 1.22, seeded01(index * 3 + 2)),
    lateral: THREE.MathUtils.lerp(-maxCenterOffset, maxCenterOffset, seeded01(index * 3 + 3)),
    boostDeltaV: THREE.MathUtils.lerp(1.8, 3.15, seeded01(index * 5 + 9)),
  };
});

export function pianoPadAt(index: number) {
  return PIANO_PAD_LAYOUT[Math.max(0, Math.min(index, PIANO_PAD_LAYOUT.length - 1))];
}
