export type PresetVideoOutputPreset =
  | "landscape-1080p"
  | "landscape-720p"
  | "portrait-1080p"
  | "portrait-720p"
  | "square-1080p";

export type PresetVideoAspectRatio = "16:9" | "9:16" | "1:1";

export type PresetVideoRenderBody = {
  presetId?: string;
  fileName?: string;
  outputPreset?: PresetVideoOutputPreset;
  durationSeconds?: number;
  fps?: number;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  originalAudioVolume?: number;
};

export type NormalizedPresetVideoRenderInput = {
  presetId: string;
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
};
