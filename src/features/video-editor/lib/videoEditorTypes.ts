export type VideoEditorAssetType = "image" | "audio" | "video";
export type VideoEditorAspectRatio = "16:9" | "9:16";
export type VideoEditorFitMode = "cover" | "contain";
export type VideoEditorTransition = "none" | "fade" | "zoom";
export type VideoEditorRenderEngine = "ffmpeg" | "remotion";

export type VideoEditorAsset = {
  id: string;
  type: VideoEditorAssetType;
  file: File;
  name: string;
  url: string;
};

export type VideoEditorClip = {
  id: string;
  assetId: string;
  type: VideoEditorAssetType;
  label: string;
  durationSeconds: number;
  fitMode: VideoEditorFitMode;
  transition: VideoEditorTransition;
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
  }>;
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
