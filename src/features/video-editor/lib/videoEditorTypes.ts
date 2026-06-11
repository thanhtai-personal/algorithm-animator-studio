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
