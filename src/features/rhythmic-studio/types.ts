export const SYNTH_PRESETS = [
  "chime",
  "piano",
  "fm",
  "vibraphone",
  "bell",
  "marimba",
  "kalimba",
  "glass",
  "steel-drum",
  "metal-hit",
  "woodblock",
  "pluck",
  "sparkle",
  "laser",
  "impact",
  "kick",
  "snare",
  "clap",
  "hihat",
  "whoosh",
] as const;

export type SynthPreset = (typeof SYNTH_PRESETS)[number];
export type DestroyMode = "chip" | "segment" | "sweep";
export type AccelerationMode = "none" | "ease-in" | "ease-out" | "pulse";

export const PLATFORM_STYLES = [
  "neon-tube",
  "neon-bar",
  "glass",
  "metal-rail",
  "dual-rail",
  "light-pods",
  "tech-pad",
  "prism",
] as const;

export type PlatformStyle = (typeof PLATFORM_STYLES)[number];
export type PlatformMixMode = "single" | "alternate" | "accent" | "shuffle";
export type MidiInstrumentMode = "auto" | "single";

export interface NoteEvent {
  id: string;
  timeMs: number;
  midi: number;
  velocity: number;
  durationMs: number;
  channel?: number;
  program?: number;
  isDrum?: boolean;
}

export interface AudioSourceMeta {
  type: "builtin" | "midi" | "audio";
  name: string;
  durationMs: number;
  eventCount: number;
}

export interface StudioSettings {
  playbackSpeed: number;
  syncOffsetMs: number;
  minBounceSpacingMs: number;
  minBounceDistance: number;
  autoSyncGaps: boolean;
  playOriginalSong: boolean;
  decoupleBallSpeed: boolean;
  accelerationMode: AccelerationMode;
  accelerationFactor: number;
  accelerationRate: number;
  minSpeedCap: number;
  maxSpeedCap: number;
  curveIntensity: number;
  curvePathLength: number;
  shieldEnabled: boolean;
  shieldRadius: number;
  shieldDestroyMode: DestroyMode;
  circleSizeMultiplier: number;
  pulseAnimation: boolean;
  glowAnimation: boolean;
  ringPulseSensitivity: number;
  animationSensitivity: number;
  spectralDensity: number;
  shellColor: string;
  prismStart: string;
  prismEnd: string;
  backgroundColor: string;
  trailLength: number;
  ballSize: number;
  particleCount: number;
  synthPreset: SynthPreset;
  synthVolume: number;
  musicVolume: number;
  synthReverb: number;
  synthBrightness: number;
  synthStereoWidth: number;
  midiPlaybackEnabled: boolean;
  midiInstrumentMode: MidiInstrumentMode;
  platformWidth: number;
  platformThickness: number;
  platformGap: number;
  laneSpread: number;
  platformTilt: number;
  bounceHeight: number;
  cameraAnchor: number;
  cameraSmoothing: number;
  platformGlow: number;
  platformPrimaryStyle: PlatformStyle;
  platformSecondaryStyle: PlatformStyle;
  platformAccentStyle: PlatformStyle;
  platformMixMode: PlatformMixMode;
  platformAccentEvery: number;
  platformDetail: number;
  impactRipple: boolean;
  showBeatLabels: boolean;
}

export interface StoredProject {
  id: string;
  name: string;
  settings: StudioSettings;
  source?: AudioSourceMeta;
  createdAt: string;
  updatedAt: string;
}
