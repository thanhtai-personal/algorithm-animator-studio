import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";

export type PublishPlatform = "youtube" | "facebook" | "tiktok" | "instagram";
export type PublishJobStatus = "scheduled" | "queued" | "running" | "success" | "failed" | "manual_required" | "cancelled";

export type PublishJob = {
  id: string;
  platform: PublishPlatform;
  status: PublishJobStatus;
  source: "generated-video" | "local-file";
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

export type AgentWorkflowSuggestion = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  severity: "info" | "warning" | "success";
};

export type CreatePublishJobInput = {
  platform: PublishPlatform;
  source?: "generated-video" | "local-file";
  videoRelativePath?: string;
  localFilePath?: string;
  title: string;
  description: string;
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

export async function getPublishJobs() {
  const data = await parseApiResponse<{ jobs: PublishJob[] }>(await fetch(buildApiUrl("/api/publish/jobs"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.jobs;
}

export async function createPublishJob(input: CreatePublishJobInput) {
  const data = await parseApiResponse<{ job: PublishJob }>(await fetch(buildApiUrl("/api/publish/jobs"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(input),
  }));
  return data.job;
}

export async function runDuePublishJobs() {
  return parseApiResponse<{ ok: boolean; processed: number; skipped?: string }>(await fetch(buildApiUrl("/api/publish/jobs/run-due"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function runPublishJob(id: string) {
  const data = await parseApiResponse<{ job: PublishJob }>(await fetch(buildApiUrl(`/api/publish/jobs/${id}/run`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.job;
}

export async function retryPublishJob(id: string) {
  const data = await parseApiResponse<{ job: PublishJob }>(await fetch(buildApiUrl(`/api/publish/jobs/${id}/retry`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.job;
}

export async function cancelPublishJob(id: string) {
  const data = await parseApiResponse<{ job: PublishJob }>(await fetch(buildApiUrl(`/api/publish/jobs/${id}/cancel`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.job;
}

export async function getPublishHistory() {
  const data = await parseApiResponse<{ history: PublishHistoryItem[] }>(await fetch(buildApiUrl("/api/publish/history"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.history;
}

export async function getPublishAgentSuggestions() {
  const data = await parseApiResponse<{ suggestions: AgentWorkflowSuggestion[] }>(await fetch(buildApiUrl("/api/publish/agent-suggestions"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.suggestions;
}
