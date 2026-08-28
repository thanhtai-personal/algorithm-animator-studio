import * as THREE from "three";
import { buildCourseSamplesFor } from "./towerCourseSampler";
import type { CourseDriveBelt } from "./towerCourse";

export const OLYMPIC_ROAD_MAP_ID = "olympic-road" as const;
export const OLYMPIC_TRACK_WIDTH = 7.4;
export const OLYMPIC_SAMPLE_COUNT = 360;
export const OLYMPIC_PLAN_SCALE = 0.75;

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

// Map 2 is a long open road, not a second tower. The route always advances
// forward in world Z, so distant modules never stack around one shared axis.
// The first chute is deliberately steep to build rolling speed from gravity;
// later sectors keep descending in gentler steps so the marbles retain energy.
const OLYMPIC_ROAD_PLAN = [
  [0, 38.0, -96], [0, 36.2, -82], [1, 34.0, -66], [4, 31.8, -50], [10, 29.8, -34],
  [20, 28.0, -20], [32, 26.2, -8], [46, 24.4, 2], [60, 22.8, 14], [68, 21.2, 28],
  [70, 19.8, 44], [66, 18.4, 60], [56, 17.1, 74], [44, 15.9, 84], [30, 14.8, 92],
  [14, 13.8, 98], [0, 12.9, 106], [-12, 12.0, 118], [-20, 11.2, 132], [-22, 10.4, 148],
  [-18, 9.6, 164], [-8, 8.8, 178], [6, 8.0, 188], [22, 7.2, 194], [38, 6.5, 202],
  [52, 5.8, 214], [60, 5.1, 228], [62, 4.5, 244], [58, 3.9, 260], [48, 3.3, 274],
  [34, 2.8, 284], [18, 2.3, 292], [4, 1.9, 300], [-8, 1.6, 312], [-12, 1.4, 328],
] as const;

export const OLYMPIC_ROAD_POINTS = OLYMPIC_ROAD_PLAN.map(([x, y, z]) => (
  [x * OLYMPIC_PLAN_SCALE, y, z * OLYMPIC_PLAN_SCALE] as const
));

export const OLYMPIC_ROAD_CURVE = new THREE.CatmullRomCurve3(
  OLYMPIC_ROAD_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
  0.22,
);

export const OLYMPIC_ROAD_SECTIONS = [
  { from: 0, to: 0.12, id: "road-launch-slope", label: "LAUNCH SLOPE", style: "road" },
  { from: 0.12, to: 0.27, id: "road-fast-s-bends", label: "FAST S-BENDS", style: "curb" },
  { from: 0.27, to: 0.41, id: "road-ridge-run", label: "RIDGE RUN", style: "neon" },
  { from: 0.41, to: 0.55, id: "road-choice-gates", label: "CHOICE GATES", style: "road" },
  { from: 0.55, to: 0.69, id: "road-downhill-switchbacks", label: "DOWNHILL SWITCHBACKS", style: "curb" },
  { from: 0.69, to: 0.83, id: "road-slalom", label: "SLALOM RUN", style: "hazard" },
  { from: 0.83, to: 0.95, id: "road-final-slope", label: "FINAL SLOPE", style: "road" },
  { from: 0.95, to: 1, id: "road-finish-podium", label: "FINISH PODIUM", style: "finish" },
] as const;

export const OLYMPIC_ROAD_OBSTACLES: readonly OlympicRoadObstacle[] = [
  { id: "launch-warning-left", kind: "hazard-diamond", progress: 0.045, lateral: -2.2, collider: [0.8, 1.25, 0.7] },
  { id: "launch-warning-right", kind: "hazard-diamond", progress: 0.075, lateral: 2.2, collider: [0.8, 1.25, 0.7] },
  { id: "bend-post-a", kind: "slalom-post", progress: 0.145, lateral: -1.9, collider: [0.7, 1.5, 0.7] },
  { id: "bend-post-b", kind: "slalom-post", progress: 0.185, lateral: 1.65, collider: [0.7, 1.5, 0.7] },
  { id: "bend-post-c", kind: "slalom-post", progress: 0.225, lateral: -0.65, collider: [0.7, 1.5, 0.7] },
  { id: "ridge-warning", kind: "hazard-diamond", progress: 0.34, lateral: 2.05, collider: [0.8, 1.25, 0.7] },
  { id: "choice-left", kind: "choice-gate", progress: 0.49, lateral: -2.1, collider: [0.9, 1.7, 0.7] },
  { id: "choice-right", kind: "choice-gate", progress: 0.49, lateral: 2.1, collider: [0.9, 1.7, 0.7] },
  { id: "switch-post-a", kind: "slalom-post", progress: 0.60, lateral: -1.65, collider: [0.7, 1.5, 0.7] },
  { id: "switch-post-b", kind: "slalom-post", progress: 0.645, lateral: 1.65, collider: [0.7, 1.5, 0.7] },
  { id: "traffic-left", kind: "traffic-light", progress: 0.72, lateral: -1.85, collider: [1.05, 1.55, 0.9] },
  { id: "traffic-right", kind: "traffic-light", progress: 0.765, lateral: 1.85, collider: [1.05, 1.55, 0.9] },
  { id: "final-post-a", kind: "slalom-post", progress: 0.85, lateral: -1.6, collider: [0.7, 1.5, 0.7] },
  { id: "final-post-b", kind: "slalom-post", progress: 0.895, lateral: 1.5, collider: [0.7, 1.5, 0.7] },
  { id: "final-warning", kind: "hazard-diamond", progress: 0.925, lateral: -2.15, collider: [0.8, 1.25, 0.7] },
];

export const OLYMPIC_ROAD_CUTS = [
  { progress: 0.41, keep: 0, label: "RIDGE EXIT" },
  { progress: 0.83, keep: 0, label: "FINAL SECTOR" },
] as const;

export const OLYMPIC_ROAD_DRIVE_BELTS: readonly CourseDriveBelt[] = [
  { id: "ridge-assist", from: 0.30, to: 0.35, targetSpeed: 9, maxAcceleration: 7 },
  { id: "choice-exit-assist", from: 0.50, to: 0.56, targetSpeed: 9.5, maxAcceleration: 8 },
  { id: "switchback-assist", from: 0.64, to: 0.70, targetSpeed: 10, maxAcceleration: 8 },
  { id: "slalom-assist", from: 0.78, to: 0.84, targetSpeed: 10, maxAcceleration: 8 },
  { id: "final-slope-assist", from: 0.91, to: 0.97, targetSpeed: 11, maxAcceleration: 9 },
];

export const OLYMPIC_ROAD_SPECIALS = {
  startGate: 0.022,
  spinnerA: 0.18,
  spinnerB: 0.74,
  chimeStart: 2,
  chimeEnd: 2,
  pianoStart: 2,
  pianoEnd: 2,
  jump: 2,
  tunnelStart: 2,
  tunnelEnd: 2,
  finalCross: 0.90,
  finish: 0.982,
} as const;

export const OLYMPIC_ROAD_SAMPLES = buildCourseSamplesFor(
  OLYMPIC_ROAD_CURVE,
  OLYMPIC_ROAD_SECTIONS,
  OLYMPIC_SAMPLE_COUNT,
);
