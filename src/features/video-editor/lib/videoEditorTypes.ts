export type VideoEditorAssetType = "image" | "audio" | "video";
export type VideoEditorAspectRatio = "16:9" | "9:16";
export type VideoEditorFitMode = "cover" | "contain";
export type VideoEditorTransition =
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
export type VideoEditorRenderEngine = "ffmpeg" | "remotion";
export type VideoEditorLyricAnimation = "karaoke" | "fade" | "pop" | "slide-up" | "typewriter";
export type VideoEditorLyricPosition = "top" | "center" | "bottom";

export type VideoEditorLyricWord = {
  text: string;
  start: number;
  end: number;
};

export type VideoEditorLyricCue = {
  id: string;
  start: number;
  end: number;
  text: string;
  words: VideoEditorLyricWord[];
};

export type VideoEditorLyrics = {
  enabled: boolean;
  sourceAssetId: string;
  language: string;
  model: string;
  animation: VideoEditorLyricAnimation;
  position: VideoEditorLyricPosition;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  cues: VideoEditorLyricCue[];
};

export type VideoEditorAsset = {
  id: string;
  type: VideoEditorAssetType;
  file: File;
  name: string;
  url: string;
  source?: "upload" | "system-music" | "silent";
  libraryTrackId?: string;
  durationSeconds?: number;
};

export type VideoEditorClip = {
  id: string;
  assetId: string;
  type: VideoEditorAssetType;
  label: string;
  durationSeconds: number;
  fitMode: VideoEditorFitMode;
  transition: VideoEditorTransition;
  transitionSeconds: number;
  keepOriginalAudio?: boolean;
  volume?: number;
};

export type TimelineRenderProject = {
  title: string;
  aspectRatio: VideoEditorAspectRatio;
  fps: number;
  renderEngine?: VideoEditorRenderEngine;
  clips: Array<{
    id: string;
    assetId: string;
    type: VideoEditorAssetType;
    durationSeconds: number;
    fitMode: VideoEditorFitMode;
    transition: VideoEditorTransition;
    transitionSeconds: number;
    keepOriginalAudio?: boolean;
    volume?: number;
  }>;
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkLogoAssetId?: string;
  lyrics?: VideoEditorLyrics;
};

export type TimelineRenderResponse = {
  ok: boolean;
  engine: "ffmpeg-timeline" | "remotion-timeline";
  fileName: string;
  relativePath: string;
  videoUrl: string;
  durationSeconds: number;
  warning?: string;
};

export type AutoLyricsResponse = {
  ok: boolean;
  sourceLabel: string;
  detectedLanguage?: string;
  cues: VideoEditorLyricCue[];
  warning?: string;
};
