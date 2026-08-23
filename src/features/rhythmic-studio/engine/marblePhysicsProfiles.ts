import type { StudioSettings, TerrainProfile } from "../types";

export interface MarblePhysicsProfile {
  terrain: TerrainProfile;
  gravity: number;
  initialDownSpeed: number;
  restitutionMin: number;
  restitutionMax: number;
  horizontalScale: number;
  verticalScale: number;
  apexScale: number;
  longGapDropPerSecond: number;
  directionHold: number;
  contactMode: "cap" | "surface" | "bumper";
  normalAngles: readonly number[];
}

const BASE: Record<TerrainProfile, Omit<MarblePhysicsProfile, "terrain">> = {
  balanced: {
    gravity: 980,
    initialDownSpeed: 300,
    restitutionMin: 0.18,
    restitutionMax: 0.76,
    horizontalScale: 0.82,
    verticalScale: 0.82,
    apexScale: 0.9,
    longGapDropPerSecond: 165,
    directionHold: 2,
    contactMode: "surface",
    normalAngles: [0, 0.16, -0.16, 0.34, -0.34, 0.58, -0.58],
  },
  "tube-board": {
    gravity: 1240,
    initialDownSpeed: 380,
    restitutionMin: 0.1,
    restitutionMax: 0.6,
    horizontalScale: 1.32,
    verticalScale: 0.9,
    apexScale: 0.66,
    longGapDropPerSecond: 150,
    directionHold: 2,
    contactMode: "cap",
    normalAngles: [
      0.14, -0.14, 0.3, -0.3, 0.48, -0.48, 0.66, -0.66,
      0.84, -0.84, 1.02, -1.02, 1.18, -1.18, 1.32, -1.32, 1.42, -1.42, 0,
    ],
  },
  comet: {
    gravity: 810,
    initialDownSpeed: 300,
    restitutionMin: 0.42,
    restitutionMax: 0.98,
    horizontalScale: 1.04,
    verticalScale: 0.56,
    apexScale: 1.68,
    longGapDropPerSecond: 92,
    directionHold: 3,
    contactMode: "bumper",
    normalAngles: [0, 0.055, -0.055, 0.11, -0.11, 0.17, -0.17, 0.23, -0.23, 0.29, -0.29],
  },
  xylophone: {
    gravity: 1080,
    initialDownSpeed: 340,
    restitutionMin: 0.1,
    restitutionMax: 0.58,
    horizontalScale: 1.08,
    verticalScale: 0.96,
    apexScale: 0.72,
    longGapDropPerSecond: 150,
    directionHold: 3,
    contactMode: "surface",
    normalAngles: [0, 0.08, -0.08, 0.16, -0.16, 0.26, -0.26, 0.34, -0.34],
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function marblePhysicsProfile(settings: StudioSettings): MarblePhysicsProfile {
  const base = BASE[settings.terrainProfile] ?? BASE.balanced;
  const spacingScale = clamp(settings.platformGap / 150, 0.72, 1.45);
  const bounceScale = clamp(settings.bounceHeight / 126, 0.62, 1.42);
  const laneScale = clamp(settings.laneSpread / 300, 0.68, 1.42);
  return {
    ...base,
    terrain: settings.terrainProfile,
    gravity: base.gravity * Math.pow(spacingScale, 0.62),
    restitutionMin: clamp(base.restitutionMin * bounceScale, 0.04, 0.95),
    restitutionMax: clamp(base.restitutionMax * bounceScale, 0.12, 0.98),
    horizontalScale: base.horizontalScale * laneScale,
    verticalScale: base.verticalScale * Math.pow(spacingScale, 0.55),
  };
}
