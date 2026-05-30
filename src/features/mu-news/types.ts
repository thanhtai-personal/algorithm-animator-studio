import type { VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "@/features/story-video/types";
import type { VoiceGenerateResult } from "@/lib/voiceApi";

export type MuNewsStepId = "sources" | "preview" | "filter" | "script" | "voice" | "video";

export type MuNewsSource = {
  id: string;
  name: string;
  url: string;
  trustScore: number;
  contentSelector?: string;
  sourceType?: "rss" | "news-search" | "official" | "manual";
};

export type MuNewsItem = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
  trustScore: number;
};

export type MuNewsFetchResponse = {
  ok: boolean;
  query: string;
  sources: MuNewsSource[];
  count: number;
  items: MuNewsItem[];
  warnings?: string[];
  dateWindow?: {
    from: string;
    to: string;
  };
};

export type MuNewsScriptResponse = {
  ok: boolean;
  engine: "openai" | "local-fallback";
  script: string;
  title: string;
  description: string;
  hashtags: string[];
  shorts: { title: string; script: string }[];
  sourceNotes: string[];
  warning?: string;
};

export type MuNewsItemValidationStatus = "idle" | "loading" | "valid" | "invalid" | "error";

export type MuNewsItemValidation = {
  status: MuNewsItemValidationStatus;
  message?: string;
  detailPublishedAt?: string;
  resolvedUrl?: string;
  articleContent?: string;
  checkedAt?: string;
};

export type MuNewsValidateItemResponse = {
  ok: boolean;
  valid: boolean;
  itemId: string;
  message: string;
  sourcePublishedAt: string;
  detailPublishedAt?: string;
  resolvedUrl?: string;
  articleContent?: string;
};

export type MuNewsVoiceSegment = {
  id: string;
  title: string;
  text: string;
  fileName: string;
  selected: boolean;
  result?: VoiceGenerateResult | null;
};

export type MuNewsDraft = {
  activeStep: MuNewsStepId;
  sourcesText: string;
  query: string;
  selectedIds: string[];
  channelName: string;
  angle: string;
  durationMinutes: number;
  voiceStyle: string;
  scriptLanguage: string;
  script: string;
  fileName: string;
  videoFileName: string;
  piperModelKey: string;
  sentenceSilence: number;
  speechRate: number;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
  voiceSegments: MuNewsVoiceSegment[];
  backgroundMusicRelativePath: string;
  backgroundMusicVolume: number;
  backgroundMusicLoop: boolean;
  backgroundMusicFadeIn: number;
  backgroundMusicFadeOut: number;
};
