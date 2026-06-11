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
};

export type NormalizedTimelineVideoClip = Required<TimelineVideoClip>;

export type NormalizedTimelineVideoProject = {
  title: string;
  aspectRatio: TimelineVideoAspectRatio;
  fps: number;
  renderEngine: TimelineVideoRenderEngine;
  clips: NormalizedTimelineVideoClip[];
  showWatermark: boolean;
  watermarkText: string;
  watermarkLogoAssetId: string;
};
