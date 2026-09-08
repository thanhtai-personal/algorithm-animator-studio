import type { ComponentType } from "react";

export type PresetVideoAspectRatio = "16:9" | "9:16" | "1:1";

export type PresetVideoSourceStrategy = "remote" | "local";

export type PresetVideoOutputPreset =
  | "landscape-1080p"
  | "landscape-720p"
  | "portrait-1080p"
  | "portrait-720p"
  | "square-1080p";

export type PresetVideoLyricTiming = {
  start: number;
  end: number;
};

export type PresetVideoEditableLyricCue = PresetVideoLyricTiming & {
  id: string;
  lines: readonly string[];
};

export type PresetVideoSourceClip = {
  id: string;
  title: string;
  watchUrl: string;
  thumbnailUrl: string;
  clipStartSeconds: number;
  clipEndSeconds: number;
};

export type PresetVideoTimelineClip = {
  id: string;
  title: string;
  clipStartSeconds: number;
  clipEndSeconds: number;
  timelineStartSeconds: number;
  timelineEndSeconds: number;
};

export type PresetVideoCompositionProps = {
  presetId: string;
  aspectRatio: PresetVideoAspectRatio;
  durationSeconds: number;
  fps: number;
  backgroundMusicUrl: string;
  backgroundMusicVolume: number;
  originalAudioVolume: number;
  lyricTimings: Record<string, PresetVideoLyricTiming>;
  videoSourceUrls: Record<string, string>;
  timelineVideoClips: readonly PresetVideoTimelineClip[];
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
  editableLyrics?: readonly PresetVideoEditableLyricCue[];
  videoSources?: readonly PresetVideoSourceClip[];
  videoSourceStrategy?: PresetVideoSourceStrategy;
  component: ComponentType<PresetVideoCompositionProps>;
};

export type PresetVideoExportSettings = {
  outputPreset: PresetVideoOutputPreset;
  trimStartSeconds: number;
  trimEndSeconds: number;
  backgroundMusicId: string;
  backgroundMusicVolume: number;
  originalAudioVolume: number;
  lyricTimings: Record<string, PresetVideoLyricTiming>;
  timelineVideoClips: PresetVideoTimelineClip[];
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

export type PresetVideoRenderProgress = {
  progress: number;
  stage: "preparing" | "metadata" | "rendering" | "muxing" | "verifying";
  message: string;
};

export type PresetVideoMediaResponse = {
  presetId: string;
  videoSourceUrls: Record<string, string>;
  missingSourceIds: string[];
};
