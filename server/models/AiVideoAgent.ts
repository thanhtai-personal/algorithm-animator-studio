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

export type AgentWorkflowStageId =
  | "research"
  | "strategy"
  | "script"
  | "visuals"
  | "voice"
  | "render"
  | "metadata"
  | "publish"
  | "engage"
  | "monetize";

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

export type CreateAgentVideoPlanBody = {
  topic?: string;
  kind?: AgentVideoKind;
  platform?: AgentVideoPlatform;
  language?: AgentVideoLanguage;
  tone?: string;
  targetDurationSec?: number;
  extraInstruction?: string;
  agentPreset?: string;
};

export type CreateAgentVideoJobBody = CreateAgentVideoPlanBody & {
  plan?: AgentVideoPlan;
  voiceProvider?: AgentVoiceProvider;
  piperModelKey?: string;
  elevenModelId?: string;
  elevenVoiceId?: string;
  supertonicVoice?: string;
  supertonicTotalSteps?: number;
  vieneuVoiceId?: string;
  vieneuMode?: string;
  vieneuEmotion?: string;
  applioTtsTemplateId?: string;
  speechRate?: number;
  sentenceSilence?: number;
  renderTitle?: string;
  renderSubtitle?: string;
  renderNarration?: string;
  renderTemplate?: AgentVideoRenderTemplate;
  renderAspectRatio?: AgentVideoRenderAspectRatio;
  renderFps?: number;
  renderPrimaryColor?: string;
  renderAccentColor?: string;
  renderAlgorithmLabel?: string;
  renderData?: string;
  renderWatermark?: string;
  renderBackgroundMusicUrl?: string;
  renderVoiceVolume?: number;
  renderBackgroundMusicVolume?: number;
  runNow?: boolean;
  scheduledAt?: string;
  autoCreatePublishJobs?: boolean;
  publishTargets?: AgentVideoPublishTarget[];
  publishChannels?: AgentVideoPublishChannel[];
  publishScheduledAt?: string;
  publishPrivacyStatus?: string;
};

export type AgentVideoJobStep = {
  id: AgentWorkflowStageId;
  label: string;
  status: AgentWorkflowStageStatus;
  progress: number;
  message?: string;
  startedAtMs?: number;
  updatedAtMs?: number;
  completedAtMs?: number;
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
  createdAtMs: number;
  updatedAtMs: number;
  scheduledAtMs?: number;
  input: Required<Pick<CreateAgentVideoPlanBody, "topic" | "kind" | "platform" | "language">> & {
    tone: string;
    targetDurationSec: number;
    extraInstruction: string;
    agentPreset: string;
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
    autoCreatePublishJobs: boolean;
    publishTargets: AgentVideoPublishTarget[];
    publishChannels: AgentVideoPublishChannel[];
    publishScheduledAt: string;
    publishPrivacyStatus: string;
  };
  progress: number;
  currentStep?: string;
  steps: AgentVideoJobStep[];
  logs: AgentVideoJobLog[];
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
    publishJobIds?: string[];
  };
  error?: string;
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
