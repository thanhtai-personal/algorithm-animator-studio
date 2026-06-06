export type StoryTopicId = "tien-hiep" | "trong-sinh" | "audio-book" | "review-truyen";
export type StoryVoiceProvider = "piper" | "elevenlabs" | "vieneu" | "applio";
export type VideoAspectRatio = "16:9" | "9:16";
export type VideoBackgroundType = "image" | "gif" | "video";
export type VideoFitMode = "cover" | "contain";

export type StoryTopicPreset = {
  id: StoryTopicId;
  title: string;
  description: string;
  filePrefix: string;
  defaultTitle: string;
  defaultSelector: string;
  prompt: string;
};

export type ExtractedTextItem = {
  ok: boolean;
  url: string;
  title?: string;
  text: string;
  characterCount: number;
  error?: string;
};

export type ExtractTextResponse = {
  ok: boolean;
  selector: string;
  combinedText: string;
  characterCount: number;
  results: ExtractedTextItem[];
};

export type ExtractLinksResponse = {
  ok: boolean;
  url: string;
  selector: string;
  count: number;
  links: { href: string; text: string }[];
};

export type GeneratedResource = {
  kind: "audio" | "video" | "music";
  fileName: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  createdAtMs: number;
};

export type GeneratedVideo = {
  ok: boolean;
  durationSeconds: number;
  fileName: string;
  relativePath: string;
  videoUrl: string;
  ffmpegWarning?: string;
};

export type GenerateVideoResponse = {
  ok: boolean;
  audio?: { audioUrl?: string; relativePath?: string };
  video: GeneratedVideo;
};
