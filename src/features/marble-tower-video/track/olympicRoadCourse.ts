import * as THREE from "three";
import { buildCourseSamplesFor } from "./towerCourseSampler";

export const OLYMPIC_ROAD_MAP_ID = "olympic-road" as const;
export const OLYMPIC_TRACK_WIDTH = 7.4;
export const OLYMPIC_SAMPLE_COUNT = 228;

// The reference toy track is a long elevated road rather than a stacked tower:
// launch chute -> giant hairpin -> illuminated spiral -> slalom/S bends -> finish chute.
// Y decreases monotonically so the race remains gravity-driven instead of motor-driven.
export const OLYMPIC_ROAD_POINTS = [
  [0, 29.0, -34], [0, 27.2, -22], [-2, 25.3, -12], [-9, 23.5, -7],
  [-14, 21.8, 0], [-13, 20.4, 9], [-7, 19.0, 15], [2, 17.8, 17],
  [10, 16.7, 13], [14, 15.6, 5], [13, 14.6, -4], [7, 13.6, -11],
  [-2, 12.7, -14], [-10, 11.8, -10], [-14, 10.9, -2], [-12, 10.0, 7],
  [-5, 9.2, 13], [4, 8.5, 13], [11, 7.8, 8], [13, 7.1, 0],
  [9, 6.5, -7], [1, 5.9, -10], [-7, 5.3, -7], [-10, 4.8, 0],
  [-7, 4.3, 7], [0, 3.9, 10], [7, 3.5, 7], [10, 3.2, 1],
  [7, 2.9, -5], [1, 2.6, -7], [-5, 2.35, -4], [-7, 2.1, 2],
  [-3, 1.9, 8], [4, 1.7, 10], [11, 1.5, 13], [19, 1.3, 19],
] as const;

export const OLYMPIC_ROAD_CURVE = new THREE.CatmullRomCurve3(
  OLYMPIC_ROAD_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
  0.28,
);

export const OLYMPIC_ROAD_SECTIONS = [
  { from: 0.00, to: 0.12, id: "road-launch", label: "LAUNCH STRAIGHT", style: "road" },
  { from: 0.12, to: 0.31, id: "road-hairpin", label: "GIANT HAIRPIN", style: "curb" },
  { from: 0.31, to: 0.52, id: "road-spiral", label: "NEON SPIRAL", style: "neon" },
  { from: 0.52, to: 0.64, id: "road-slalom", label: "SLALOM GATES", style: "hazard" },
  { from: 0.64, to: 0.77, id: "road-s", label: "S-CURVE", style: "road" },
  { from: 0.77, to: 0.88, id: "road-final-hairpin", label: "FINAL HAIRPIN", style: "curb" },
  { from: 0.88, to: 0.95, id: "road-hazard", label: "HAZARD CHUTE", style: "hazard" },
  { from: 0.95, to: 1.00, id: "road-finish", label: "CHECKER FINISH", style: "finish" },
] as const;

export const OLYMPIC_ROAD_CUTS = [
  { progress: 0.34, keep: 0, label: "SPIRAL SECTOR" },
  { progress: 0.68, keep: 0, label: "S-CURVE SECTOR" },
  { progress: 0.89, keep: 0, label: "FINAL SECTOR" },
] as const;

export const OLYMPIC_ROAD_SPECIALS = {
  startGate: 0.025,
  spinnerA: 0.565,
  spinnerB: 0.705,
  chimeStart: 2,
  chimeEnd: 2,
  pianoStart: 2,
  pianoEnd: 2,
  jump: 2,
  tunnelStart: 0.34,
  tunnelEnd: 0.50,
  finalCross: 0.905,
  finish: 0.985,
} as const;

export const OLYMPIC_ROAD_SAMPLES = buildCourseSamplesFor(
  OLYMPIC_ROAD_CURVE,
  OLYMPIC_ROAD_SECTIONS,
  OLYMPIC_SAMPLE_COUNT,
);
