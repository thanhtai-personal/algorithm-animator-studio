export type GeneratedResourceKind = "audio" | "video" | "music";

export type GeneratedResource = {
  kind: GeneratedResourceKind;
  fileName: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  createdAtMs: number;
  youtubeMetadata?: GeneratedYoutubeMetadata;
  youtubeDescriptionAppend?: string;
};

export type GeneratedYoutubeMetadata = {
  title: string;
  description: string;
  tags: string;
  lang: "en" | "vi";
  videoType?: string;
};

export type YoutubeUploadHistoryItem = {
  id: string;
  status: "success" | "failure";
  attemptedAtMs: number;
  source: "browser-upload" | "generated-video";
  sourceRelativePath?: string;
  sourceFileName?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  title?: string;
  privacyStatus?: string;
  playlistId?: string;
  channelId?: string;
  channelTitle?: string;
  message?: string;
};
