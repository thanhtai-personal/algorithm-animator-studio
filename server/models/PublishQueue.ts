export type PublishPlatform = "youtube" | "facebook" | "tiktok" | "instagram";

export type PublishJobStatus =
  | "scheduled"
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "manual_required"
  | "cancelled";

export type PublishJobSource = "generated-video" | "local-file";

export type PublishJob = {
  id: string;
  platform: PublishPlatform;
  status: PublishJobStatus;
  source: PublishJobSource;
  sourceRelativePath?: string;
  sourceFilePath?: string;
  sourceFileName?: string;
  title: string;
  description: string;
  tags?: string;
  privacyStatus?: string;
  publishAt?: string;
  scheduledAtMs?: number;
  channelId?: string;
  channelTitle?: string;
  providerAccountId?: string;
  youtubeRefreshToken?: string;
  youtubePlaylistId?: string;
  madeForKids?: boolean;
  notifySubscribers?: boolean;
  containsSyntheticMedia?: boolean;
  attempts: number;
  maxAttempts: number;
  progress: number;
  message?: string;
  resultId?: string;
  resultUrl?: string;
  createdAtMs: number;
  updatedAtMs: number;
  startedAtMs?: number;
  completedAtMs?: number;
};

export type PublishHistoryItem = {
  id: string;
  jobId: string;
  platform: PublishPlatform;
  status: "success" | "failure" | "manual_required";
  attemptedAtMs: number;
  sourceFileName?: string;
  sourceRelativePath?: string;
  title?: string;
  channelId?: string;
  channelTitle?: string;
  resultId?: string;
  resultUrl?: string;
  message?: string;
};

export type CreatePublishJobBody = {
  platform?: PublishPlatform;
  source?: PublishJobSource;
  videoRelativePath?: string;
  localFilePath?: string;
  title?: string;
  description?: string;
  tags?: string;
  privacyStatus?: string;
  publishAt?: string;
  scheduledAt?: string;
  channelId?: string;
  channelTitle?: string;
  providerAccountId?: string;
  youtubeRefreshToken?: string;
  youtubePlaylistId?: string;
  madeForKids?: boolean;
  notifySubscribers?: boolean;
  containsSyntheticMedia?: boolean;
};

export type AgentWorkflowSuggestion = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  severity: "info" | "warning" | "success";
};
