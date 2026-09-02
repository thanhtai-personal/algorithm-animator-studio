export type TimelineVideoAspectRatio = "16:9" | "9:16";
export type TimelineVideoFitMode = "cover" | "contain";
export type TimelineVideoTransition =
  | "blurry"
  | "fade"
  | "zoom-in"
  | "zoom-out"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "push-left"
  | "push-right"
  | "none";
export type TimelineVideoAssetType = "image" | "audio" | "video";
export type TimelineVideoRenderEngine = "ffmpeg" | "remotion";
export type TimelineLyricAnimation = "karaoke" | "fade" | "pop" | "slide-up" | "typewriter";
export type TimelineLyricPosition = "top" | "center" | "bottom";

export type TimelineLyricWord = {
  text?: string;
  start?: number;
  end?: number;
};

export type TimelineLyricCue = {
  id?: string;
  start?: number;
  end?: number;
  text?: string;
  words?: TimelineLyricWord[];
};

export type TimelineLyrics = {
  enabled?: boolean;
  sourceAssetId?: string;
  language?: string;
  model?: string;
  animation?: TimelineLyricAnimation;
  position?: TimelineLyricPosition;
  fontSize?: number;
  textColor?: string;
  highlightColor?: string;
  outlineColor?: string;
  cues?: TimelineLyricCue[];
};

export type TimelineVideoClip = {
  id?: string;
  assetId?: string;
  type?: TimelineVideoAssetType;
  durationSeconds?: number;
  fitMode?: TimelineVideoFitMode;
  transition?: TimelineVideoTransition;
  transitionSeconds?: number;
  keepOriginalAudio?: boolean;
  volume?: number;
};

export type TimelineVideoRenderProject = {
  title?: string;
  aspectRatio?: TimelineVideoAspectRatio;
  fps?: number;
  renderEngine?: TimelineVideoRenderEngine;
  clips?: TimelineVideoClip[];
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkLogoAssetId?: string;
  lyrics?: TimelineLyrics;
};

export type NormalizedTimelineVideoClip = Required<TimelineVideoClip>;
export type NormalizedTimelineLyricWord = { text: string; start: number; end: number };
export type NormalizedTimelineLyricCue = { id: string; start: number; end: number; text: string; words: NormalizedTimelineLyricWord[] };
export type NormalizedTimelineLyrics = {
  enabled: boolean;
  sourceAssetId: string;
  language: string;
  model: string;
  animation: TimelineLyricAnimation;
  position: TimelineLyricPosition;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  cues: NormalizedTimelineLyricCue[];
};

export type NormalizedTimelineVideoProject = {
  title: string;
  aspectRatio: TimelineVideoAspectRatio;
  fps: number;
  renderEngine: TimelineVideoRenderEngine;
  clips: NormalizedTimelineVideoClip[];
  showWatermark: boolean;
  watermarkText: string;
  watermarkLogoAssetId: string;
  lyrics: NormalizedTimelineLyrics;
};
