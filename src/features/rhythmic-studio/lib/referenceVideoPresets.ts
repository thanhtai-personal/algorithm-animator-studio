import type { StudioSettings } from "../types";
import { KOROBEINIKI_MELODY_NAME } from "../defaults";

export const REFERENCE_CLIP_PRESET_MAP = {
  "013b": "toy-pegboard",
  "0e70": "vibraphone-wall",
  "3949": "vibraphone-wall",
  "4739": "vibraphone-wall",
  "4fd7": "vibraphone-wall",
  "54ce": "vibraphone-wall",
  "57c8": "vibraphone-wall",
  a154: "vibraphone-wall",
  ad97: "neon-comet",
  hB8lCZ8xGZo_005: "vibraphone-wall",
  tXxHSu15xU8_002: "reference-korobeiniki-tubes",
} as const;

export const NEW_REFERENCE_PRESET_IDS = [
  "reference-korobeiniki-tubes",
] as const;

export const REFERENCE_VIDEO_PRESET_IDS = [
  "toy-pegboard",
  "neon-comet",
  "vibraphone-wall",
  ...NEW_REFERENCE_PRESET_IDS,
] as const;

export type ReferenceVideoPresetId = (typeof REFERENCE_CLIP_PRESET_MAP)[keyof typeof REFERENCE_CLIP_PRESET_MAP];
export type NewReferencePresetId = (typeof NEW_REFERENCE_PRESET_IDS)[number];

export interface ReferenceVideoPreset {
  id: NewReferencePresetId;
  referenceClipIds: readonly string[];
  builtinMelody?: string;
  settings: Partial<StudioSettings>;
}

export const REFERENCE_VIDEO_PRESETS: ReferenceVideoPreset[] = [
  {
    id: "reference-korobeiniki-tubes",
    referenceClipIds: ["tXxHSu15xU8_002"],
    builtinMelody: KOROBEINIKI_MELODY_NAME,
    settings: {
      titleText: "Korobeiniki",
      terrainProfile: "xylophone", cameraProfile: "xylophone", backgroundPreset: "velvet-stage", backgroundColor: "#8e8b9a", backgroundMotion: 0.02,
      colorPaletteMode: "key-rainbow", prismStart: "#5ffbf8", prismEnd: "#f5a6bf", ballStyle: "striped", ballBaseColor: "#4a0d76", ballStripeColor: "#ff8bc8", ballSize: 18,
      platformPrimaryStyle: "wall-boomwhacker-tube", platformSecondaryStyle: "wall-boomwhacker-tube", platformAccentStyle: "instrument-wire", platformMixMode: "single", platformAccentEvery: 12,
      instrumentFamily: "boomwhacker", instrumentLayout: "wall-score", showcaseRails: true, showcaseRailDensity: 0.4, showcaseDuet: false,
      platformWidth: 116, platformThickness: 32, platformGap: 136, laneSpread: 278, platformTilt: 4, minBounceDistance: 48, bounceHeight: 54,
      curveIntensity: 0, curvePathLength: 0, cameraAnchor: 0.34, cameraSmoothing: 0.32, cameraDistance: 1.08, cameraLookAhead: 0.92,
      platformGlow: 0.02, platformDetail: 0.94, trailLength: 0, particleCount: 0, spectralDensity: 0.02, animationSensitivity: 0.18,
      pulseAnimation: true, glowAnimation: false, impactRipple: false, impactPlatformLight: false,
      synthPreset: "boomwhacker", midiInstrumentMode: "single", midiPlaybackEnabled: true, instrumentNativeAudio: true,
    },
  },
];
