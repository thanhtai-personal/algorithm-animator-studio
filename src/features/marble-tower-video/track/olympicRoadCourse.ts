import * as THREE from "three";
import { buildCourseSamplesFor } from "./towerCourseSampler";
import type { CourseDriveBelt } from "./towerCourse";

export const OLYMPIC_ROAD_MAP_ID = "olympic-road" as const;
export const OLYMPIC_TRACK_WIDTH = 7.4;
export const OLYMPIC_SAMPLE_COUNT = 320;
export const OLYMPIC_PLAN_SCALE = 0.62;
export const OLYMPIC_SPIRAL_CENTER: [number, number, number] = [
  -8 * OLYMPIC_PLAN_SCALE,
  18.72,
  8 * OLYMPIC_PLAN_SCALE,
];

export type OlympicRoadObstacleKind =
  | "hazard-diamond"
  | "choice-gate"
  | "slalom-post"
  | "traffic-light";

export type OlympicRoadObstacle = {
  id: string;
  kind: OlympicRoadObstacleKind;
  progress: number;
  lateral: number;
  collider: readonly [number, number, number];
};

// Map 2 is intentionally a compact tabletop road course like the reference
// video: launch straight -> broad U-turn -> spiral bowl -> bridge/U-turn ->
// S-bends -> final hairpin -> ranking chute. It must not reuse the descending
// tower grammar from Map 1. Y only drops gradually to keep gravity as the motor.
const OLYMPIC_ROAD_XZ = [
  [0, -54], [0, -44], [0, -34], [0, -24], [0, -14],
  [3, -7], [10, -3], [18, -3], [25, -7], [28, -14], [27, -22], [22, -28], [15, -31], [8, -31],
  [2, -27], [-4, -21], [-7, -14], [-6, -7], [-2, -2],
  [-2.87, -6.10], [4.07, -1.63], [6.94, 5.31], [5.15, 12.73], [-0.54, 18.20],
  [-8.31, 20.80], [-15.87, 19.11], [-21.04, 13.78], [-22.46, 6.45], [-19.92, 0.02],
  [-14.57, -3.70], [-8.22, -3.45], [-3.03, 0.44], [-0.79, 6.17], [-1.99, 11.79],
  [-5.89, 15.47], [-10.81, 15.88], [-14.67, 12.96], [-15.92, 8.31], [-14.18, 4.16],
  [-10.14, 2.03], [-5.82, 2.65], [-2, 10], [5, 12], [12, 16], [20, 18], [28, 18],
  [34, 22], [35, 30], [31, 37], [24, 40], [17, 39], [11, 34], [10, 28],
  [7, 23], [1, 22], [-5, 26], [-8, 32], [-5, 38], [2, 41], [8, 45], [9, 52],
  [5, 58], [-2, 61], [-10, 60], [-17, 55], [-20, 48],
  [-19, 41], [-14, 36], [-7, 35], [0, 38], [4, 44], [4, 51], [0, 57], [-6, 60],
  [-12, 60], [-17, 56], [-19, 50], [-17, 44], [-12, 40], [-6, 40], [-1, 44], [1, 50],
  [1, 58], [0, 66], [0, 76],
] as const;

export const OLYMPIC_ROAD_POINTS = OLYMPIC_ROAD_XZ.map(([x, z], index) => {
  const progress = index / Math.max(1, OLYMPIC_ROAD_XZ.length - 1);
  const y = THREE.MathUtils.lerp(33.84, 2.4, progress);
  return [x * OLYMPIC_PLAN_SCALE, y, z * OLYMPIC_PLAN_SCALE] as const;
});

export const OLYMPIC_ROAD_CURVE = new THREE.CatmullRomCurve3(
  OLYMPIC_ROAD_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
  0.18,
);

export const OLYMPIC_ROAD_SECTIONS = [
  { from: 0, to: 0.10, id: "road-launch", label: "LAUNCH STRAIGHT", style: "road" },
  { from: 0.10, to: 0.27, id: "road-showcase-hairpin", label: "SHOWCASE HAIRPIN", style: "curb" },
  { from: 0.27, to: 0.49, id: "road-spiral-bowl", label: "SPIRAL BOWL", style: "neon" },
  { from: 0.49, to: 0.58, id: "road-choice-gates", label: "CHOICE GATES", style: "road" },
  { from: 0.58, to: 0.74, id: "road-switchbacks", label: "SWITCHBACKS", style: "curb" },
  { from: 0.74, to: 0.88, id: "road-slalom", label: "SLALOM", style: "hazard" },
  { from: 0.88, to: 0.95, id: "road-final-chute", label: "FINAL CHUTE", style: "road" },
  { from: 0.95, to: 1, id: "road-finish-podium", label: "FINISH PODIUM", style: "finish" },
] as const;

export const OLYMPIC_ROAD_OBSTACLES: readonly OlympicRoadObstacle[] = [
  { id: "launch-warning-left", kind: "hazard-diamond", progress: 0.035, lateral: -2.2, collider: [0.8, 1.25, 0.7] },
  { id: "launch-warning-right", kind: "hazard-diamond", progress: 0.06, lateral: 2.2, collider: [0.8, 1.25, 0.7] },
  { id: "hairpin-post-a", kind: "slalom-post", progress: 0.11, lateral: -1.9, collider: [0.7, 1.5, 0.7] },
  { id: "hairpin-post-b", kind: "slalom-post", progress: 0.145, lateral: 1.65, collider: [0.7, 1.5, 0.7] },
  { id: "hairpin-post-c", kind: "slalom-post", progress: 0.18, lateral: -0.65, collider: [0.7, 1.5, 0.7] },
  { id: "bridge-choice-left", kind: "choice-gate", progress: 0.535, lateral: -2.1, collider: [0.9, 1.7, 0.7] },
  { id: "bridge-choice-right", kind: "choice-gate", progress: 0.535, lateral: 2.1, collider: [0.9, 1.7, 0.7] },
  { id: "s-post-a", kind: "slalom-post", progress: 0.665, lateral: -1.65, collider: [0.7, 1.5, 0.7] },
  { id: "s-post-b", kind: "slalom-post", progress: 0.705, lateral: 1.65, collider: [0.7, 1.5, 0.7] },
  { id: "traffic-left", kind: "traffic-light", progress: 0.755, lateral: -1.85, collider: [1.05, 1.55, 0.9] },
  { id: "traffic-right", kind: "traffic-light", progress: 0.79, lateral: 1.85, collider: [1.05, 1.55, 0.9] },
  { id: "final-post-a", kind: "slalom-post", progress: 0.845, lateral: -1.6, collider: [0.7, 1.5, 0.7] },
  { id: "final-post-b", kind: "slalom-post", progress: 0.88, lateral: 1.5, collider: [0.7, 1.5, 0.7] },
  { id: "final-warning", kind: "hazard-diamond", progress: 0.92, lateral: -2.15, collider: [0.8, 1.25, 0.7] },
];

export const OLYMPIC_ROAD_CUTS = [
  { progress: 0.49, keep: 0, label: "SPIRAL EXIT" },
  { progress: 0.79, keep: 0, label: "FINAL SECTOR" },
] as const;

export const OLYMPIC_ROAD_DRIVE_BELTS: readonly CourseDriveBelt[] = [
  { id: "hairpin-exit-rollers", from: 0.235, to: 0.285, targetSpeed: 10, maxAcceleration: 10 },
  { id: "spiral-powered-bowl", from: 0.27, to: 0.505, targetSpeed: 12, maxAcceleration: 12 },
  { id: "choice-gate-exit-rollers", from: 0.52, to: 0.61, targetSpeed: 10, maxAcceleration: 10 },
  { id: "switchback-rollers", from: 0.6, to: 0.7, targetSpeed: 10, maxAcceleration: 10 },
  { id: "post-sweeper-rollers", from: 0.69, to: 0.88, targetSpeed: 10, maxAcceleration: 10 },
  { id: "final-chute-rollers", from: 0.915, to: 0.97, targetSpeed: 10, maxAcceleration: 10 },
];

export const OLYMPIC_ROAD_SPECIALS = {
  startGate: 0.022,
  spinnerA: 0.16,
  spinnerB: 0.72,
  chimeStart: 2,
  chimeEnd: 2,
  pianoStart: 2,
  pianoEnd: 2,
  jump: 2,
  tunnelStart: 0.2,
  tunnelEnd: 0.49,
  finalCross: 0.9,
  finish: 0.982,
} as const;

export const OLYMPIC_ROAD_SAMPLES = buildCourseSamplesFor(
  OLYMPIC_ROAD_CURVE,
  OLYMPIC_ROAD_SECTIONS,
  OLYMPIC_SAMPLE_COUNT,
);
