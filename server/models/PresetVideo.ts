export type PresetVideoOutputPreset =
  | "landscape-1080p"
  | "landscape-720p"
  | "portrait-1080p"
  | "portrait-720p"
  | "square-1080p";

export type PresetVideoLanguage = "en" | "vi";
export type PresetVideoAspectRatio = "16:9" | "9:16" | "1:1";
export type PresetVideoSourceStrategy = "remote" | "local";

export type PresetVideoLyricTiming = { start?: number; end?: number };
export type PresetVideoSourceClipRequest = { id?: string; watchUrl?: string; clipStartSeconds?: number; clipEndSeconds?: number };
export type PresetVideoTimelineClipRequest = PresetVideoSourceClipRequest & { title?: string; timelineStartSeconds?: number; timelineEndSeconds?: number };

export type PresetVideoRenderBody = {
  presetId?: string;
  language?: PresetVideoLanguage;
  fileName?: string;
  outputPreset?: PresetVideoOutputPreset;
  durationSeconds?: number;
  fps?: number;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  originalAudioVolume?: number;
  voiceoverAudioRelativePath?: string;
  voiceoverVolume?: number;
  lyricTimings?: Record<string, PresetVideoLyricTiming>;
  videoSources?: PresetVideoSourceClipRequest[];
  timelineVideoClips?: PresetVideoTimelineClipRequest[];
  videoSourceStrategy?: PresetVideoSourceStrategy;
};

export type PresetVideoMediaPrepareBody = { presetId?: string; videoSources?: PresetVideoSourceClipRequest[]; videoSourceStrategy?: PresetVideoSourceStrategy };
export type NormalizedPresetVideoSourceClip = { id: string; watchUrl: string; clipStartSeconds: number; clipEndSeconds: number };
export type NormalizedPresetVideoTimelineClip = NormalizedPresetVideoSourceClip & { title: string; timelineStartSeconds: number; timelineEndSeconds: number };
export type NormalizedPresetVideoRenderInput = {
  presetId: string;
  language: PresetVideoLanguage;
  fileName: string;
  outputPreset: PresetVideoOutputPreset;
  aspectRatio: PresetVideoAspectRatio;
  width: number;
  height: number;
  durationSeconds: number;
  fps: number;
  trimStartSeconds: number;
  trimEndSeconds: number;
  backgroundMusicUrl: string;
  backgroundMusicVolume: number;
  originalAudioVolume: number;
  voiceoverAudioRelativePath: string;
  voiceoverVolume: number;
  lyricTimings: Record<string, { start: number; end: number }>;
  videoSources: NormalizedPresetVideoSourceClip[];
  timelineVideoClips: NormalizedPresetVideoTimelineClip[];
  videoSourceStrategy: PresetVideoSourceStrategy;
};
