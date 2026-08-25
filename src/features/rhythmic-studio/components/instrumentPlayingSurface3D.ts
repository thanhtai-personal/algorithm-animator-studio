import type { PlatformStyle } from "../types";

export interface InstrumentPlayingSurface3D {
  faceKind: "edge" | "front" | "top";
  pitchRad: number;
  localStrikeY: number;
  localStrikeZ: number;
  projectedStrikeY: number;
  projectedStrikeZ: number;
  normalY: number;
  normalZ: number;
  marbleContactZ: number;
  contactCorrection: number;
  centerInset: number;
  frontDepth: number;
}

interface PlayingFaceProfile {
  faceKind: "front" | "top";
  pitchDeg: number;
  strikePoint: (height: number, depth: number) => { y: number; z: number };
}

export interface InstrumentSurfaceFrame3D {
  angleRad: number;
  normalX: number;
  normalY: number;
  normalAlignment: number;
}

const PLAYING_FACE_PROFILES: Partial<Record<PlatformStyle, PlayingFaceProfile>> = {
  "instrument-cymbal": {
    faceKind: "front",
    pitchDeg: -58,
    strikePoint: (_height, depth) => ({ y: 0, z: depth * 0.14 + 0.065 }),
  },
  "drum-disc": {
    faceKind: "front",
    pitchDeg: -58,
    strikePoint: (height, depth) => ({ y: 0, z: Math.max(depth * 0.14, height * 0.52) }),
  },
  "gong-disc": {
    faceKind: "front",
    pitchDeg: -54,
    strikePoint: (_height, depth) => ({ y: 0, z: depth * 0.085 }),
  },
  "instrument-pad": {
    faceKind: "front",
    pitchDeg: -54,
    strikePoint: (_height, depth) => ({ y: 0, z: depth * 0.52 }),
  },
  "instrument-key": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.11) * 0.5, z: 0 }),
  },
  "xylophone-key": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.11) * 0.5, z: 0 }),
  },
  "xylophone-bar": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.12) * 0.5, z: 0 }),
  },
  "piano-key": {
    faceKind: "top",
    pitchDeg: 38,
    strikePoint: (height) => ({ y: Math.max(height, 0.13) * 0.5, z: 0 }),
  },
  "piano-keyboard": {
    faceKind: "top",
    pitchDeg: 38,
    strikePoint: (height, depth) => ({
      y: Math.max(
        -height * 0.06 + Math.max(0.13, height * 0.95) * 0.5,
        height * 0.2 + Math.max(0.105, height * 0.72) * 0.5,
      ),
      z: depth * 0.48,
    }),
  },
  "marimba-bar": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.13) * 0.5, z: 0 }),
  },
  "pluck-pad": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.12) * 0.5, z: 0 }),
  },
  "vibraphone-bar": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.12) * 0.5, z: 0 }),
  },
  "metallophone-plate": {
    faceKind: "top",
    pitchDeg: 34,
    strikePoint: (height) => ({ y: Math.max(height, 0.12) * 0.5, z: 0 }),
  },
};

function fallbackFrontDepth(style: PlatformStyle, height: number, depth: number) {
  if (
    style === "boomwhacker-tube"
    || style === "tube-cylinder"
    || style === "toy-tube"
    || style === "toy-peg"
    || style.includes("tube")
  ) return Math.max(0.1, height * 0.56);
  if (style === "flute-pipe") return Math.max(0.1, height * 0.52);
  if (style.includes("rail") || style === "instrument-wire") return Math.max(0.055, height * 0.24);
  return depth * 0.5;
}

export function instrumentSurfaceFrame3D(
  angleRad: number,
  physicalNormalX: number,
  physicalNormalY: number,
): InstrumentSurfaceFrame3D {
  const normalLength = Math.hypot(physicalNormalX, physicalNormalY) || 1;
  const targetX = physicalNormalX / normalLength;
  const targetY = physicalNormalY / normalLength;
  let normalX = Math.sin(angleRad);
  let normalY = -Math.cos(angleRad);
  let normalAlignment = targetX * normalX + targetY * normalY;
  let orientedAngle = angleRad;

  if (normalAlignment < 0) {
    orientedAngle += Math.PI;
    normalX = -normalX;
    normalY = -normalY;
    normalAlignment = -normalAlignment;
  }

  return {
    angleRad: orientedAngle,
    normalX,
    normalY,
    normalAlignment: Math.max(0, Math.min(1, normalAlignment)),
  };
}

export function instrumentPlayingSurface3D(
  style: PlatformStyle,
  _width: number,
  height: number,
  depth: number,
  ballRadius: number,
  normalAlignment = 1,
): InstrumentPlayingSurface3D {
  const safeRadius = Math.max(0, ballRadius);
  const safeAlignment = Math.max(0, Math.min(1, normalAlignment));
  const profile = PLAYING_FACE_PROFILES[style];
  if (!profile) {
    const frontDepth = fallbackFrontDepth(style, height, depth);
    const contactCorrection = safeRadius * (1 - safeAlignment);
    return {
      faceKind: "edge",
      pitchRad: 0,
      localStrikeY: height * 0.5,
      localStrikeZ: frontDepth,
      projectedStrikeY: height * 0.5,
      projectedStrikeZ: frontDepth,
      normalY: 1,
      normalZ: 0,
      marbleContactZ: 0,
      contactCorrection,
      centerInset: height * 0.5 + contactCorrection,
      frontDepth,
    };
  }

  const pitchRad = profile.pitchDeg * Math.PI / 180;
  const { y: localStrikeY, z: localStrikeZ } = profile.strikePoint(height, depth);
  const normalY = profile.faceKind === "front" ? -Math.sin(pitchRad) : Math.cos(pitchRad);
  const normalZ = profile.faceKind === "front" ? Math.cos(pitchRad) : Math.sin(pitchRad);
  const projectedStrikeY = localStrikeY * Math.cos(pitchRad) - localStrikeZ * Math.sin(pitchRad);
  const projectedStrikeZ = localStrikeY * Math.sin(pitchRad) + localStrikeZ * Math.cos(pitchRad);
  const marbleContactZ = safeRadius * normalZ;
  // Split the radius offset across screen-space Y and camera-space Z. Keeping
  // the marble at z=0 forced an inclined drum/key face through the sphere.
  const contactCorrection = (safeRadius - marbleContactZ * normalZ) / normalY
    - safeRadius * safeAlignment;

  return {
    faceKind: profile.faceKind,
    pitchRad,
    localStrikeY,
    localStrikeZ,
    projectedStrikeY,
    projectedStrikeZ,
    normalY,
    normalZ,
    marbleContactZ,
    contactCorrection,
    centerInset: projectedStrikeY + contactCorrection,
    frontDepth: projectedStrikeZ,
  };
}

export function instrumentMarbleContactDepth3D(style: PlatformStyle, ballRadius: number) {
  const profile = PLAYING_FACE_PROFILES[style];
  if (!profile) return 0;
  const pitchRad = profile.pitchDeg * Math.PI / 180;
  const normalZ = profile.faceKind === "front" ? Math.cos(pitchRad) : Math.sin(pitchRad);
  return Math.max(0, ballRadius) * Math.max(0, normalZ);
}

export function instrumentPressOffset3D(surface: InstrumentPlayingSurface3D, distance: number) {
  const safeDistance = Math.max(0, distance);
  return {
    y: -surface.normalY * safeDistance,
    z: -surface.normalZ * safeDistance,
  };
}
