export type VideoAspectRatio = "16:9" | "9:16";
export type VideoBackgroundType = "image" | "gif" | "video";
export type VideoFitMode = "cover" | "contain";
export type VideoProvider = "piper" | "pro";

export type VideoGenerationOptions = {
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
  videoFileName?: string;
  backgroundMusicPath?: string;
  backgroundMusicVolume: number;
  backgroundMusicLoop: boolean;
  backgroundMusicFadeIn: number;
  backgroundMusicFadeOut: number;
};

export type GenerateVideoFromTextBody = {
  text?: string;
  provider?: VideoProvider;
  modelKey?: string;
  proModelId?: string;
  voiceId?: string;
  sentenceSilence?: number;
  speechRate?: number;
  fileName?: string;
  videoFileName?: string;
  aspectRatio?: VideoAspectRatio;
  backgroundType?: VideoBackgroundType;
  fitMode?: VideoFitMode;
  backgroundMusicRelativePath?: string;
  backgroundMusicVolume?: string;
  backgroundMusicLoop?: string;
  backgroundMusicFadeIn?: string;
  backgroundMusicFadeOut?: string;
};

export type GenerateVideoFromAudioBody = {
  audioRelativePath?: string;
  videoFileName?: string;
  aspectRatio?: VideoAspectRatio;
  backgroundType?: VideoBackgroundType;
  fitMode?: VideoFitMode;
  backgroundMusicRelativePath?: string;
  backgroundMusicVolume?: string;
  backgroundMusicLoop?: string;
  backgroundMusicFadeIn?: string;
  backgroundMusicFadeOut?: string;
};
