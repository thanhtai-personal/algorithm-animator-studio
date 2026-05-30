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

export type MuNewsScriptBody = {
  items: MuNewsItem[];
  channelName?: string;
  angle?: string;
  durationMinutes?: number;
  voiceStyle?: string;
  scriptLanguage?: string;
};

export type MuNewsValidateItemBody = {
  item?: MuNewsItem;
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
