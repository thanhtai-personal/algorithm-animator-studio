export type VideoEditorAssetType = "image" | "audio" | "video";
export type VideoEditorAspectRatio = "16:9" | "9:16";
export type VideoEditorFitMode = "cover" | "contain";
export type VideoEditorTransition = "none" | "fade" | "zoom";

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
  engine: "ffmpeg-timeline";
  fileName: string;
  relativePath: string;
  videoUrl: string;
  durationSeconds: number;
  warning?: string;
};
