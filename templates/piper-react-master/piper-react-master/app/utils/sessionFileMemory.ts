export type SessionGeneratedResource = {
  fileName: string;
  relativePath: string;
  url: string;
  sizeBytes?: number;
  createdAtMs?: number;
};

export type VideoStudioSessionFiles = {
  uploadedAudioFile: File | null;
  backgroundFile: File | null;
};

export type YoutubeUploadSessionFiles = {
  videoFile: File | null;
};

export type StudioSessionResources = {
  lastTtsAudio: SessionGeneratedResource | null;
  lastGeneratedVideo: SessionGeneratedResource | null;
};

export type TtsSessionDraft = {
  text: string;
};

export const videoStudioSessionFiles: VideoStudioSessionFiles = {
  uploadedAudioFile: null,
  backgroundFile: null,
};

export const youtubeUploadSessionFiles: YoutubeUploadSessionFiles = {
  videoFile: null,
};

export const studioSessionResources: StudioSessionResources = {
  lastTtsAudio: null,
  lastGeneratedVideo: null,
};

export const ttsSessionDraft: TtsSessionDraft = {
  text: "",
};
