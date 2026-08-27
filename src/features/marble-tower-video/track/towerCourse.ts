import * as THREE from "three";

export const TOWER_RACE_MAP_ID = "original-tower-run";
export const TRACK_WIDTH = 8.8;
export const TRACK_THICKNESS = 0.34;
export const MARBLE_RADIUS = 0.48;
export const SAMPLE_COUNT = 184;
export const TOWER_HEIGHT_SCALE = 1.9;
const TOWER_BASE_Y = 1.35;

const TOWER_PLAN_POINTS = [
  [0, 35.0, -8], [0, 34.0, 0], [6.5, 32.8, 7], [10.5, 30.2, 15],
  [8.0, 28.2, 24], [0.5, 26.6, 28], [-8.0, 24.8, 24], [-11.5, 22.8, 15],
  [-8.0, 21.0, 5], [-1.0, 19.6, -1], [8.0, 18.4, 1], [13.2, 17.0, 9],
  [12.0, 15.5, 19], [5.5, 14.1, 27], [-4.0, 12.8, 29], [-12.0, 11.5, 23],
  [-14.0, 10.1, 13], [-10.0, 8.9, 3], [-2.0, 7.9, -3], [7.0, 7.0, -1],
  [13.5, 6.2, 6], [14.0, 5.4, 16], [9.0, 4.7, 25], [1.0, 4.0, 31],
  [-7.0, 3.5, 30], [-12.0, 3.0, 24], [-10.0, 2.6, 16], [-3.0, 2.2, 12],
  [6.0, 1.9, 14], [13.0, 1.6, 20], [18.0, 1.35, 28],
] as const;

// Keep the proven horizontal route while opening the vertical spacing between
// decks. The old late-race floors were only 3.26 units apart, which trapped the
// camera between guard walls. Scaling around the finish floor preserves its
// ground clearance and gives every overlapping deck at least 6 units of room.
export const TOWER_POINTS = TOWER_PLAN_POINTS.map(([x, y, z]) => (
  [x, TOWER_BASE_Y + (y - TOWER_BASE_Y) * TOWER_HEIGHT_SCALE, z] as const
));

export const COURSE_CURVE = new THREE.CatmullRomCurve3(
  TOWER_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
  0.34,
);

export const COURSE_SECTIONS = [
  { from: 0.00, to: 0.10, id: "start", label: "TOWER DROP", style: "rainbow" },
  { from: 0.10, to: 0.22, id: "switchback", label: "RAINBOW SWITCHBACK", style: "rainbow" },
  { from: 0.22, to: 0.32, id: "spinner", label: "TWIN SPINNER", style: "dark" },
  { from: 0.32, to: 0.45, id: "hairpin", label: "HAIRPIN BOWL", style: "rainbow" },
  { from: 0.45, to: 0.54, id: "chimes", label: "CHIME GAUNTLET", style: "dark" },
  { from: 0.54, to: 0.64, id: "piano", label: "PIANO BRIDGE", style: "piano" },
  { from: 0.64, to: 0.74, id: "spiral", label: "SPIRAL DROP", style: "rainbow" },
  { from: 0.74, to: 0.84, id: "tunnel", label: "PRISM TUNNEL", style: "blue" },
  { from: 0.84, to: 0.94, id: "chaos", label: "FINAL CHAOS", style: "dark" },
  { from: 0.94, to: 1.00, id: "finish", label: "FINAL SPRINT", style: "finish" },
] as const;

export const CUTS = [
  { progress: 0.38, keep: 6, label: "TOP 6 QUALIFY" },
  { progress: 0.66, keep: 4, label: "TOP 4 QUALIFY" },
  { progress: 0.86, keep: 2, label: "FINAL 2" },
] as const;

export type CourseDriveBelt = {
  id: string;
  from: number;
  to: number;
  targetSpeed: number;
  maxAcceleration: number;
};

export const TOWER_DRIVE_BELTS: readonly CourseDriveBelt[] = [
  { id: "final-drive-belt", from: 0.91, to: 0.98, targetSpeed: 7, maxAcceleration: 4.2 },
];

export const SPECIALS = {
  startGate: 0.026,
  spinnerA: 0.245,
  spinnerB: 0.292,
  chimeStart: 0.455,
  chimeEnd: 0.525,
  pianoStart: 0.545,
  pianoEnd: 0.635,
  jump: 0.715,
  tunnelStart: 0.755,
  tunnelEnd: 0.825,
  finalCross: 0.885,
  finish: 0.985,
} as const;

export const RAINBOW_COLORS = ["#ff3155", "#ff8c22", "#ffd938", "#47db69", "#2bd6d9", "#4777ff", "#a653ff"] as const;
