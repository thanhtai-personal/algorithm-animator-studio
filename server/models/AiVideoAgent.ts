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

export type CreateAgentVideoPlanBody = {
  topic?: string;
  kind?: AgentVideoKind;
  platform?: AgentVideoPlatform;
  language?: AgentVideoLanguage;
  tone?: string;
  targetDurationSec?: number;
  extraInstruction?: string;
};

export type CreateAgentVideoJobBody = CreateAgentVideoPlanBody & {
  plan?: AgentVideoPlan;
  piperModelKey?: string;
  speechRate?: number;
  sentenceSilence?: number;
  runNow?: boolean;
  scheduledAt?: string;
};

export type AgentVideoJobStep = {
  id: "plan" | "voice" | "background" | "render" | "metadata";
  label: string;
  status: "pending" | "running" | "done" | "failed";
  message?: string;
  updatedAtMs?: number;
};

export type AgentVideoJob = {
  id: string;
  status: AgentVideoJobStatus;
  createdAtMs: number;
  updatedAtMs: number;
  scheduledAtMs?: number;
  input: Required<Pick<CreateAgentVideoPlanBody, "topic" | "kind" | "platform" | "language">> & {
    tone: string;
    targetDurationSec: number;
    extraInstruction: string;
    piperModelKey: string;
    speechRate: number;
    sentenceSilence: number;
  };
  progress: number;
  currentStep?: string;
  steps: AgentVideoJobStep[];
  plan?: AgentVideoPlan;
  artifacts?: {
    audioRelativePath?: string;
    audioUrl?: string;
    videoRelativePath?: string;
    videoUrl?: string;
    metadata?: {
      title: string;
      description: string;
      tags: string;
    };
  };
  error?: string;
};
