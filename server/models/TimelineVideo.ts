export type TimelineVideoAspectRatio = "16:9" | "9:16";
export type TimelineVideoFitMode = "cover" | "contain";
export type TimelineVideoTransition = "none" | "fade" | "zoom";
export type TimelineVideoAssetType = "image" | "audio" | "video";
export type TimelineVideoRenderEngine = "ffmpeg" | "remotion";

export type TimelineVideoClip = {
  id?: string;
  assetId?: string;
  type?: TimelineVideoAssetType;
  durationSeconds?: number;
  fitMode?: TimelineVideoFitMode;
  transition?: TimelineVideoTransition;
};

export type TimelineVideoRenderProject = {
  title?: string;
  aspectRatio?: TimelineVideoAspectRatio;
  fps?: number;
  renderEngine?: TimelineVideoRenderEngine;
  clips?: TimelineVideoClip[];
};

export type NormalizedTimelineVideoClip = Required<TimelineVideoClip>;

export type NormalizedTimelineVideoProject = {
  title: string;
  aspectRatio: TimelineVideoAspectRatio;
  fps: number;
  renderEngine: TimelineVideoRenderEngine;
  clips: NormalizedTimelineVideoClip[];
};
