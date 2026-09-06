import type { ComponentType } from "react";

export type PresetVideoAspectRatio = "16:9" | "9:16" | "1:1";

export type PresetVideoOutputPreset =
  | "landscape-1080p"
  | "landscape-720p"
  | "portrait-1080p"
  | "portrait-720p"
  | "square-1080p";

export type PresetVideoCompositionProps = {
  presetId: string;
  aspectRatio: PresetVideoAspectRatio;
  durationSeconds: number;
  fps: number;
  backgroundMusicUrl: string;
  backgroundMusicVolume: number;
  originalAudioVolume: number;
};

export type PresetVideoDefinition = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  accentColor: string;
  defaultDurationSeconds: number;
  defaultFps: number;
  defaultOutputPreset: PresetVideoOutputPreset;
  hasOriginalAudio: boolean;
  component: ComponentType<PresetVideoCompositionProps>;
};

export type PresetVideoExportSettings = {
  outputPreset: PresetVideoOutputPreset;
  trimStartSeconds: number;
  trimEndSeconds: number;
  backgroundMusicId: string;
  backgroundMusicVolume: number;
  originalAudioVolume: number;
};

export type PresetVideoRenderResponse = {
  ok: boolean;
  engine: "remotion";
  presetId: string;
  fileName: string;
  relativePath: string;
  videoUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
};
