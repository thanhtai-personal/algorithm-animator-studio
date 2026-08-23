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
  "pipe-rail",
  "stair-step",
  "glass-borosilicate",
  "glass-tempered",
  "glass-frosted",
  "glass-acrylic",
  "glass-optic",
  "toy-peg",
  "toy-tube",
] as const;

export type PlatformStyle = (typeof PLATFORM_STYLES)[number];
export type PlatformMixMode = "single" | "alternate" | "accent" | "shuffle";

export const COURSE_LONG_ITEMS = [
  "glass-tube",
  "glass-channel",
  "acrylic-pipe",
  "neon-bridge",
  "stair-flight",
] as const;

export type CourseLongItem = (typeof COURSE_LONG_ITEMS)[number];
export type CourseItemStyle = PlatformStyle | CourseLongItem;

export interface CourseItemOverride {
  id: string;
  startIndex: number;
  span: number;
  style: CourseItemStyle;
}
export const BALL_STYLES = [
  "classic",
  "chrome",
  "glass",
  "neon",
  "striped",
  "prism",
] as const;

export type BallStyle = (typeof BALL_STYLES)[number];
export type ColorPaletteMode = "duotone" | "rainbow";
export type MidiInstrumentMode = "auto" | "single";
export const EXPORT_FPS_OPTIONS = [30, 60, 120] as const;
export type ExportFps = (typeof EXPORT_FPS_OPTIONS)[number];

export const BACKGROUND_PRESETS = [
  "neon-grid",
  "aurora",
  "starfield",
  "sunset",
  "spotlight",
  "deep-space",
  "pipe-tower",
  "stairway",
  "tube-tunnel",
  "toy-board",
] as const;

export type BackgroundPreset = (typeof BACKGROUND_PRESETS)[number];
export type BackgroundFit = "cover" | "contain";
export type LyricStyle = "karaoke" | "minimal" | "boxed";
export type LyricPosition = "top" | "middle" | "bottom";

export interface LyricCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

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
  exportFps: ExportFps;
  titleText: string;
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
  ballStyle: BallStyle;
  colorPaletteMode: ColorPaletteMode;
  backgroundPreset: BackgroundPreset;
  backgroundMotion: number;
  backgroundImageOpacity: number;
  backgroundImageBlur: number;
  backgroundImageFit: BackgroundFit;
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
  lyricsEnabled: boolean;
  lyricStyle: LyricStyle;
  lyricPosition: LyricPosition;
  lyricFontSize: number;
  lyricColor: string;
  lyricAccentColor: string;
  lyricShadow: number;
  lyricShowNext: boolean;
}

export interface StoredProject {
  id: string;
  name: string;
  settings: StudioSettings;
  source?: AudioSourceMeta;
  courseOverrides?: CourseItemOverride[];
  createdAt: string;
  updatedAt: string;
}
