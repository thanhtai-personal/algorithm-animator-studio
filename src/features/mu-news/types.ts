import type { VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "@/features/story-video/types";

export type MuNewsSource = {
  id: string;
  name: string;
  url: string;
  trustScore: number;
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

export type MuNewsDraft = {
  sourcesText: string;
  query: string;
  selectedIds: string[];
  channelName: string;
  angle: string;
  durationMinutes: number;
  voiceStyle: string;
  script: string;
  fileName: string;
  videoFileName: string;
  piperModelKey: string;
  sentenceSilence: number;
  speechRate: number;
  aspectRatio: VideoAspectRatio;
  backgroundType: VideoBackgroundType;
  fitMode: VideoFitMode;
};
