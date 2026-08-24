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
    restitutionMin: 0.56,
    restitutionMax: 0.78,
    horizontalScale: 0.82,
    verticalScale: 0.82,
    apexScale: 0.9,
    longGapDropPerSecond: 165,
    directionHold: 2,
    contactMode: "surface",
    normalAngles: [0, 0.16, -0.16, 0.34, -0.34, 0.58, -0.58],
  },
  "tube-board": {
    gravity: 1140,
    initialDownSpeed: 334,
    restitutionMin: 0.5,
    restitutionMax: 0.72,
    horizontalScale: 1.08,
    verticalScale: 0.8,
    apexScale: 0.52,
    longGapDropPerSecond: 160,
    directionHold: 4,
    contactMode: "surface",
    normalAngles: [
      0, 0.14, -0.14, 0.28, -0.28, 0.42, -0.42, 0.56, -0.56, 0.7, -0.7,
    ],
  },
  comet: {
    gravity: 840,
    initialDownSpeed: 285,
    restitutionMin: 0.58,
    restitutionMax: 0.82,
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
    restitutionMin: 0.54,
    restitutionMax: 0.76,
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
  // Bounce height is a user preference, not an excuse to inject or remove huge
  // amounts of energy on every note. Keep it within a physically believable
  // range and let gravity + the incoming velocity drive most of the motion.
  const bounceScale = clamp(settings.bounceHeight / 90, 0.84, 1.14);
  const laneScale = clamp(settings.laneSpread / 300, 0.68, 1.42);
  const ballProfile = settings.ballStyle === "chrome"
    ? { gravity: 1.04, restitution: 0.84, horizontal: 0.96, vertical: 0.98 }
    : settings.ballStyle === "glass"
      ? { gravity: 1, restitution: 0.94, horizontal: 0.99, vertical: 1 }
      : settings.ballStyle === "neon"
        ? { gravity: 0.98, restitution: 1.08, horizontal: 1.03, vertical: 1.04 }
        : settings.ballStyle === "prism"
          ? { gravity: 0.97, restitution: 1.1, horizontal: 1.04, vertical: 1.05 }
          : settings.ballStyle === "striped"
            ? { gravity: 1.01, restitution: 1.02, horizontal: 0.99, vertical: 1 }
            : { gravity: 1, restitution: 0.98, horizontal: 1, vertical: 1 };
  return {
    ...base,
    terrain: settings.terrainProfile,
    gravity: base.gravity * Math.pow(spacingScale, 0.62) * ballProfile.gravity,
    restitutionMin: clamp(base.restitutionMin * bounceScale * ballProfile.restitution, 0.04, 0.95),
    restitutionMax: clamp(base.restitutionMax * bounceScale * ballProfile.restitution, 0.12, 0.98),
    horizontalScale: base.horizontalScale * laneScale * ballProfile.horizontal,
    verticalScale: base.verticalScale * Math.pow(spacingScale, 0.55) * ballProfile.vertical,
  };
}

export function marbleEntrySpeed(settings: StudioSettings) {
  const profile = marblePhysicsProfile(settings);
  return Math.max(
    profile.initialDownSpeed,
    Math.sqrt(2 * profile.gravity * Math.max(44, settings.ballSize * 3.4)),
  );
}
