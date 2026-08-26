import * as THREE from "three";
import { buildCourseSamplesFor } from "./towerCourseSampler";

export const OLYMPIC_ROAD_MAP_ID = "olympic-road" as const;
export const OLYMPIC_TRACK_WIDTH = 7.4;
export const OLYMPIC_SAMPLE_COUNT = 320;

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

// Reference sequence: launch -> showcase hairpin -> spiral bowl -> choice gates
// -> elevated switchbacks -> slalom -> final chute -> ranked finish lanes.
// Height decreases throughout so gravity remains the only forward motor.
export const OLYMPIC_ROAD_POINTS = [
  [0, 30, -38], [0, 29, -31], [0, 27.8, -23], [0, 26.5, -15],
  [-6, 25, -9], [-13, 23.5, -8], [-17, 22, -2], [-16, 20.5, 6],
  [-10, 19, 12], [-2, 17.8, 14], [7, 16.6, 12], [13, 15.5, 7],
  [15, 14.5, 0], [12, 13.6, -7], [5, 12.8, -11], [-2, 12.1, -11],
  [-8, 11.4, -7], [-11, 10.7, 0], [-8, 10, 7], [-1, 9.3, 10],
  [6, 8.6, 8], [10, 7.9, 2], [8, 7.2, -5], [2, 6.6, -8],
  [-4, 6, -6], [-7, 5.5, -1], [-5, 5, 4], [0, 4.6, 6],
  [5, 4.2, 3], [6, 3.9, -2], [2, 3.6, -5], [7, 3.4, -8],
  [14, 3.2, -6], [17, 3, 0], [14, 2.8, 6], [8, 2.6, 10],
  [0, 2.4, 10], [-7, 2.2, 6], [-9, 2, 0], [-6, 1.8, -5],
  [0, 1.65, -7], [7, 1.5, -4], [10, 1.35, 1], [8, 1.2, 6],
  [2, 1.05, 8], [-3, 0.9, 6], [-5, 0.75, 1], [-2, 0.62, -3],
  [3, 0.5, -4], [8, 0.38, -1], [12, 0.3, 4], [14, 0.22, 10],
  [17, 0.15, 16], [20, 0.1, 22],
] as const;

export const OLYMPIC_ROAD_CURVE = new THREE.CatmullRomCurve3(
  OLYMPIC_ROAD_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
  0.28,
);

export const OLYMPIC_ROAD_SECTIONS = [
  { from: 0, to: 0.1, id: "road-launch", label: "LAUNCH STRAIGHT", style: "road" },
  { from: 0.1, to: 0.27, id: "road-showcase-hairpin", label: "SHOWCASE HAIRPIN", style: "curb" },
  { from: 0.27, to: 0.49, id: "road-spiral-bowl", label: "SPIRAL BOWL", style: "neon" },
  { from: 0.49, to: 0.58, id: "road-choice-gates", label: "CHOICE GATES", style: "hazard" },
  { from: 0.58, to: 0.74, id: "road-switchbacks", label: "ELEVATED SWITCHBACKS", style: "curb" },
  { from: 0.74, to: 0.88, id: "road-slalom", label: "TRAFFIC SLALOM", style: "hazard" },
  { from: 0.88, to: 0.95, id: "road-final-chute", label: "FINAL CHUTE", style: "hazard" },
  { from: 0.95, to: 1, id: "road-finish-podium", label: "RANKED FINISH", style: "finish" },
] as const;

export const OLYMPIC_ROAD_OBSTACLES: readonly OlympicRoadObstacle[] = [
  { id: "launch-warning-left", kind: "hazard-diamond", progress: 0.045, lateral: -2.35, collider: [0.7, 1.25, 0.45] },
  { id: "launch-warning-right", kind: "hazard-diamond", progress: 0.065, lateral: 2.35, collider: [0.7, 1.25, 0.45] },
  { id: "launch-warning-center", kind: "hazard-diamond", progress: 0.085, lateral: 0, collider: [0.7, 1.25, 0.45] },
  { id: "hairpin-post-a", kind: "slalom-post", progress: 0.145, lateral: -2, collider: [0.65, 1.45, 0.65] },
  { id: "hairpin-post-b", kind: "slalom-post", progress: 0.18, lateral: 1.8, collider: [0.65, 1.45, 0.65] },
  { id: "hairpin-post-c", kind: "slalom-post", progress: 0.225, lateral: -0.8, collider: [0.65, 1.45, 0.65] },
  { id: "choice-left", kind: "choice-gate", progress: 0.525, lateral: -2.4, collider: [1.1, 1.7, 0.45] },
  { id: "choice-center", kind: "choice-gate", progress: 0.525, lateral: 0, collider: [1.1, 1.7, 0.45] },
  { id: "choice-right", kind: "choice-gate", progress: 0.525, lateral: 2.4, collider: [1.1, 1.7, 0.45] },
  { id: "switchback-post-a", kind: "slalom-post", progress: 0.635, lateral: -1.75, collider: [0.65, 1.45, 0.65] },
  { id: "switchback-post-b", kind: "slalom-post", progress: 0.69, lateral: 1.75, collider: [0.65, 1.45, 0.65] },
  { id: "traffic-left", kind: "traffic-light", progress: 0.775, lateral: -1.9, collider: [1.05, 1.55, 0.75] },
  { id: "traffic-right", kind: "traffic-light", progress: 0.815, lateral: 1.9, collider: [1.05, 1.55, 0.75] },
  { id: "final-warning-left", kind: "hazard-diamond", progress: 0.9, lateral: -2.25, collider: [0.7, 1.25, 0.45] },
  { id: "final-warning-right", kind: "hazard-diamond", progress: 0.925, lateral: 2.25, collider: [0.7, 1.25, 0.45] },
];

export const OLYMPIC_ROAD_CUTS = [
  { progress: 0.29, keep: 0, label: "SPIRAL SECTOR" },
  { progress: 0.58, keep: 0, label: "SWITCHBACK SECTOR" },
  { progress: 0.88, keep: 0, label: "FINAL SECTOR" },
] as const;

export const OLYMPIC_ROAD_SPECIALS = {
  startGate: 0.03,
  spinnerA: 0.205,
  spinnerB: 0.79,
  chimeStart: 2,
  chimeEnd: 2,
  pianoStart: 2,
  pianoEnd: 2,
  jump: 2,
  tunnelStart: 0.28,
  tunnelEnd: 0.49,
  finalCross: 0.905,
  finish: 0.975,
} as const;

export const OLYMPIC_ROAD_SAMPLES = buildCourseSamplesFor(
  OLYMPIC_ROAD_CURVE,
  OLYMPIC_ROAD_SECTIONS,
  OLYMPIC_SAMPLE_COUNT,
);
