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
    gravity: 1180,
    initialDownSpeed: 340,
    restitutionMin: 0.08,
    restitutionMax: 0.48,
    horizontalScale: 1.16,
    verticalScale: 0.82,
    apexScale: 0.56,
    longGapDropPerSecond: 164,
    directionHold: 4,
    contactMode: "cap",
    normalAngles: [
      0.12, -0.12, 0.28, -0.28, 0.44, -0.44, 0.62, -0.62,
      0.8, -0.8, 0.96, -0.96, 0,
    ],
  },
  comet: {
    gravity: 840,
    initialDownSpeed: 285,
    restitutionMin: 0.24,
    restitutionMax: 0.7,
    horizontalScale: 0.9,
    verticalScale: 0.56,
    apexScale: 1.12,
    longGapDropPerSecond: 122,
    directionHold: 3,
    contactMode: "bumper",
    normalAngles: [0, 0.055, -0.055, 0.11, -0.11, 0.17, -0.17, 0.23, -0.23, 0.29, -0.29],
  },
  xylophone: {
    gravity: 1200,
    initialDownSpeed: 316,
    restitutionMin: 0.1,
    restitutionMax: 0.46,
    horizontalScale: 0.78,
    verticalScale: 0.86,
    apexScale: 0.54,
    longGapDropPerSecond: 148,
    directionHold: 3,
    contactMode: "surface",
    normalAngles: [0, 0.04, -0.04, 0.09, -0.09, 0.15, -0.15, 0.21, -0.21],
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
