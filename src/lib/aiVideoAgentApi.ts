import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";

export type AgentVideoKind = "algorithm" | "football" | "story" | "generic";
export type AgentVideoPlatform = "youtube-short" | "youtube-long" | "tiktok" | "facebook-reel";
export type AgentVideoLanguage = "vi" | "en";
export type AgentVideoJobStatus = "draft" | "queued" | "running" | "review_ready" | "success" | "failed" | "cancelled";
export type AgentVideoPublishTarget = "youtube" | "facebook" | "tiktok" | "instagram";
export type AgentVoiceProvider = "piper" | "elevenlabs" | "supertonic" | "vieneu" | "applio";
export type AgentVideoRenderTemplate = "algorithm-explainer" | "news-card" | "story-card";
export type AgentVideoRenderAspectRatio = "auto" | "16:9" | "9:16";

export type AgentVideoPublishChannel = {
  id: string;
  platform: AgentVideoPublishTarget;
  title: string;
  providerAccountId?: string;
  youtubeRefreshToken?: string;
  youtubePlaylistId?: string;
};
export type AgentWorkflowStageId = "research" | "strategy" | "script" | "visuals" | "voice" | "render" | "metadata" | "publish" | "engage" | "monetize";
export type AgentWorkflowStageStatus = "pending" | "running" | "done" | "failed" | "skipped";

export type AgentVideoScene = {
  id: string;
  title: string;
  narration: string;
  onScreenText: string;
  visualPrompt: string;
  durationSec: number;
  brollPrompt?: string;
  editInstruction?: string;
};

export type AgentVideoPlan = {
  title: string;
  description: string;
  tags: string[];
  hook: string;
  thumbnailPrompt: string;
  scenes: AgentVideoScene[];
  publishNotes: string[];
  researchSummary?: string;
  contentAngles?: string[];
  audiencePersona?: string;
  engagementPrompts?: string[];
  monetizationIdeas?: string[];
  repurposeIdeas?: string[];
  warning?: string;
};

export type AgentVideoJobLog = {
  id: string;
  atMs: number;
  stageId?: AgentWorkflowStageId;
  level: "info" | "success" | "warning" | "error";
  message: string;
};

export type AgentVideoJob = {
  id: string;
  status: AgentVideoJobStatus;
  locked?: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  scheduledAtMs?: number;
  input: AgentVideoForm & {
    agentPreset: string;
    autoCreatePublishJobs: boolean;
    autoRunPublishJobs: boolean;
    publishTargets: AgentVideoPublishTarget[];
    publishChannels: AgentVideoPublishChannel[];
    publishScheduledAt: string;
    publishPrivacyStatus: string;
  };
  progress: number;
  currentStep?: string;
  steps: Array<{ id: AgentWorkflowStageId; label: string; status: AgentWorkflowStageStatus; progress: number; message?: string; startedAtMs?: number; completedAtMs?: number; updatedAtMs?: number }>;
  logs: AgentVideoJobLog[];
  plan?: AgentVideoPlan;
  artifacts?: {
    audioRelativePath?: string;
    audioUrl?: string;
    videoRelativePath?: string;
    videoUrl?: string;
    metadata?: { title: string; description: string; tags: string };
    publishJobIds?: string[];
  };
  error?: string;
};

export type AgentVideoForm = {
  topic: string;
  kind: AgentVideoKind;
  platform: AgentVideoPlatform;
  language: AgentVideoLanguage;
  tone: string;
  targetDurationSec: number;
  extraInstruction: string;
  voiceProvider: AgentVoiceProvider;
  piperModelKey: string;
  elevenModelId: string;
  elevenVoiceId: string;
  supertonicVoice: string;
  supertonicTotalSteps: number;
  vieneuVoiceId: string;
  vieneuMode: string;
  vieneuEmotion: string;
  applioTtsTemplateId: string;
  speechRate: number;
  sentenceSilence: number;
  renderTitle: string;
  renderSubtitle: string;
  renderNarration: string;
  renderTemplate: AgentVideoRenderTemplate;
  renderAspectRatio: AgentVideoRenderAspectRatio;
  renderFps: number;
  renderPrimaryColor: string;
  renderAccentColor: string;
  renderAlgorithmLabel: string;
  renderData: string;
  renderWatermark: string;
  renderBackgroundMusicUrl: string;
  renderVoiceVolume: number;
  renderBackgroundMusicVolume: number;
  agentPreset?: string;
  autoCreatePublishJobs?: boolean;
  autoRunPublishJobs?: boolean;
  publishTargets?: AgentVideoPublishTarget[];
  publishChannels?: AgentVideoPublishChannel[];
  publishScheduledAt?: string;
  publishPrivacyStatus?: string;
};

export type AgentPreset = {
  id: string;
  title: string;
  description: string;
  kind: AgentVideoKind;
  platform: AgentVideoPlatform;
  language: AgentVideoLanguage;
  tone: string;
  targetDurationSec: number;
  extraInstruction: string;
};

export async function getAgentPresets() {
  const data = await parseApiResponse<{ presets: AgentPreset[] }>(await fetch(buildApiUrl("/api/ai-video-agent/presets"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.presets;
}

export async function createAgentVideoPlan(payload: Partial<AgentVideoForm>) {
  return parseApiResponse<AgentVideoPlan>(await fetch(buildApiUrl("/api/ai-video-agent/plan"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function createAgentVideoJob(payload: Partial<AgentVideoForm> & { plan?: AgentVideoPlan; runNow?: boolean; scheduledAt?: string }) {
  return parseApiResponse<AgentVideoJob>(await fetch(buildApiUrl("/api/ai-video-agent/jobs"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }));
}

export async function runAgentVideoJob(id: string) {
  return parseApiResponse<AgentVideoJob>(await fetch(buildApiUrl(`/api/ai-video-agent/jobs/${id}/run`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function runAgentVideoJobInBackground(id: string) {
  return parseApiResponse<AgentVideoJob>(await fetch(buildApiUrl(`/api/ai-video-agent/jobs/${id}/run-background`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function getAgentVideoJob(id: string) {
  return parseApiResponse<AgentVideoJob>(await fetch(buildApiUrl(`/api/ai-video-agent/jobs/${id}`), {
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function cancelAgentVideoJob(id: string) {
  return parseApiResponse<AgentVideoJob>(await fetch(buildApiUrl(`/api/ai-video-agent/jobs/${id}/cancel`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function setAgentVideoJobLocked(id: string, locked: boolean) {
  return parseApiResponse<AgentVideoJob>(await fetch(buildApiUrl(`/api/ai-video-agent/jobs/${id}/lock`), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ locked }),
  }));
}

export async function deleteAgentVideoJob(id: string) {
  return parseApiResponse<{ ok: boolean; deleted: number }>(await fetch(buildApiUrl(`/api/ai-video-agent/jobs/${id}`), {
    method: "DELETE",
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function runDueAgentVideoJobs() {
  return parseApiResponse<{ ok: boolean; ran: number; jobs: AgentVideoJob[] }>(await fetch(buildApiUrl("/api/ai-video-agent/jobs/run-due"), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders(),
  }));
}

export async function listAgentVideoJobs() {
  const data = await parseApiResponse<{ jobs: AgentVideoJob[] }>(await fetch(buildApiUrl("/api/ai-video-agent/jobs"), {
    headers: buildRuntimeSettingsHeaders(),
  }));
  return data.jobs;
}
