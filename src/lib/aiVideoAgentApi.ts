import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";

export type AgentVideoKind = "algorithm" | "football" | "story" | "generic";
export type AgentVideoPlatform = "youtube-short" | "youtube-long" | "tiktok" | "facebook-reel";
export type AgentVideoLanguage = "vi" | "en";
export type AgentVideoJobStatus = "draft" | "queued" | "running" | "success" | "failed" | "cancelled";

export type AgentVideoScene = {
  id: string;
  title: string;
  narration: string;
  onScreenText: string;
  visualPrompt: string;
  durationSec: number;
};

export type AgentVideoPlan = {
  title: string;
  description: string;
  tags: string[];
  hook: string;
  thumbnailPrompt: string;
  scenes: AgentVideoScene[];
  publishNotes: string[];
  warning?: string;
};

export type AgentVideoJob = {
  id: string;
  status: AgentVideoJobStatus;
  createdAtMs: number;
  updatedAtMs: number;
  scheduledAtMs?: number;
  input: {
    topic: string;
    kind: AgentVideoKind;
    platform: AgentVideoPlatform;
    language: AgentVideoLanguage;
    tone: string;
    targetDurationSec: number;
    extraInstruction: string;
    piperModelKey: string;
    speechRate: number;
    sentenceSilence: number;
  };
  progress: number;
  currentStep?: string;
  steps: Array<{ id: string; label: string; status: "pending" | "running" | "done" | "failed"; message?: string }>;
  plan?: AgentVideoPlan;
  artifacts?: {
    audioRelativePath?: string;
    audioUrl?: string;
    videoRelativePath?: string;
    videoUrl?: string;
    metadata?: { title: string; description: string; tags: string };
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
  piperModelKey: string;
  speechRate: number;
  sentenceSilence: number;
};

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
