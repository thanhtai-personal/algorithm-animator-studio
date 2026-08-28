import type { StudioSettings } from "../types";
import { KOROBEINIKI_MELODY_NAME } from "../defaults";

export const REFERENCE_CLIP_PRESET_MAP = {
  "013b": "toy-pegboard",
  "0e70": "boomwhacker-wall",
  "3949": "vibraphone-wall",
  "4739": "vibraphone-wall",
  "4fd7": "boomwhacker-wall",
  "54ce": "vibraphone-wall",
  "57c8": "vibraphone-wall",
  a154: "reference-cyan-piano",
  ad97: "neon-comet",
  hB8lCZ8xGZo_005: "reference-era-corridor",
  tXxHSu15xU8_002: "reference-korobeiniki-tubes",
} as const;

export const NEW_REFERENCE_PRESET_IDS = [
  "reference-cyan-piano",
  "reference-era-corridor",
  "reference-korobeiniki-tubes",
] as const;

export const REFERENCE_VIDEO_PRESET_IDS = [
  "toy-pegboard",
  "neon-comet",
  "boomwhacker-wall",
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
      terrainProfile: "xylophone", cameraProfile: "xylophone", backgroundPreset: "spotlight", backgroundColor: "#8e8b9a", backgroundMotion: 0,
      colorPaletteMode: "key-rainbow", prismStart: "#5ffbf8", prismEnd: "#f5a6bf", ballStyle: "striped", ballBaseColor: "#4a0d76", ballStripeColor: "#ff8bc8", ballSize: 18,
      platformPrimaryStyle: "wall-boomwhacker-tube", platformSecondaryStyle: "wall-boomwhacker-tube", platformAccentStyle: "instrument-wire", platformMixMode: "single", platformAccentEvery: 12,
      instrumentFamily: "boomwhacker", instrumentLayout: "wall-score", showcaseRails: true, showcaseRailDensity: 0.4, showcaseDuet: false,
      platformWidth: 116, platformThickness: 32, platformGap: 136, laneSpread: 278, platformTilt: 4, minBounceDistance: 48, bounceHeight: 54,
      curveIntensity: 0, curvePathLength: 0, cameraAnchor: 0.28, cameraSmoothing: 0.18, cameraDistance: 1.02, cameraLookAhead: 1.08,
      platformGlow: 0.02, platformDetail: 0.94, trailLength: 0, particleCount: 0, spectralDensity: 0.02, animationSensitivity: 0.18,
      pulseAnimation: true, glowAnimation: false, impactRipple: false, impactPlatformLight: false,
      synthPreset: "boomwhacker", midiInstrumentMode: "single", midiPlaybackEnabled: true, instrumentNativeAudio: true,
    },
  },
  {
    id: "reference-cyan-piano",
    referenceClipIds: ["a154"],
    settings: {
      terrainProfile: "xylophone", cameraProfile: "xylophone", backgroundPreset: "deep-space", backgroundColor: "#031624",
      colorPaletteMode: "duotone", prismStart: "#e9fbff", prismEnd: "#28e6e6", ballStyle: "glass", ballBaseColor: "#8eefff", ballSize: 16,
      platformPrimaryStyle: "piano-key", platformSecondaryStyle: "piano-keyboard", platformAccentStyle: "instrument-rail", platformMixMode: "accent", platformAccentEvery: 9,
      instrumentFamily: "piano", instrumentLayout: "split", showcaseRails: true, showcaseRailDensity: 0.7,
      platformWidth: 136, platformThickness: 16, platformGap: 148, laneSpread: 238, minBounceDistance: 58, bounceHeight: 64,
      curveIntensity: 0, curvePathLength: 0, cameraAnchor: 0.49, cameraSmoothing: 0.2, cameraDistance: 1.18, cameraLookAhead: 1.16,
      platformGlow: 0.42, platformDetail: 0.96, trailLength: 4, particleCount: 1,
    },
  },
  {
    id: "reference-era-corridor",
    referenceClipIds: ["hB8lCZ8xGZo_005"],
    settings: {
      terrainProfile: "xylophone", cameraProfile: "xylophone", backgroundPreset: "spotlight", backgroundColor: "#d7dee5",
      colorPaletteMode: "duotone", prismStart: "#303238", prismEnd: "#d6dbe0", ballStyle: "glass", ballBaseColor: "#9fffc8", ballSize: 16,
      platformPrimaryStyle: "instrument-pad", platformSecondaryStyle: "instrument-cymbal", platformAccentStyle: "piano-key", platformMixMode: "accent", platformAccentEvery: 8,
      instrumentFamily: "mixed", instrumentLayout: "corridor", showcaseRails: true, showcaseRailDensity: 0.86,
      platformWidth: 106, platformThickness: 18, platformGap: 132, laneSpread: 260, minBounceDistance: 44, bounceHeight: 56,
      curveIntensity: 0, curvePathLength: 0, cameraAnchor: 0.48, cameraSmoothing: 0.18, cameraDistance: 1.08, cameraLookAhead: 1.16,
      platformGlow: 0.16, platformDetail: 0.94, trailLength: 3, particleCount: 1, impactRipple: false,
    },
  },
];
