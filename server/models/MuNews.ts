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

export type MuNewsFetchBody = {
  sources?: MuNewsSource[];
  query?: string;
  maxItems?: number;
};

export type MuNewsScriptBody = {
  items: MuNewsItem[];
  channelName?: string;
  angle?: string;
  durationMinutes?: number;
  voiceStyle?: string;
  scriptLanguage?: string;
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
