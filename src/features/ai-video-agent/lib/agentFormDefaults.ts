import type { AgentVideoForm } from "@/lib/aiVideoAgentApi";

const BASE_RENDER_DEFAULTS: Pick<
  AgentVideoForm,
  | "renderTitle"
  | "renderSubtitle"
  | "renderNarration"
  | "renderTemplate"
  | "renderAspectRatio"
  | "renderFps"
  | "renderPrimaryColor"
  | "renderAccentColor"
  | "renderAlgorithmLabel"
  | "renderData"
  | "renderWatermark"
  | "renderBackgroundMusicUrl"
  | "renderVoiceVolume"
  | "renderBackgroundMusicVolume"
> = {
  renderTitle: "",
  renderSubtitle: "",
  renderNarration: "",
  renderTemplate: "algorithm-explainer",
  renderAspectRatio: "auto",
  renderFps: 30,
  renderPrimaryColor: "#020617",
  renderAccentColor: "#38bdf8",
  renderAlgorithmLabel: "Bubble Sort",
  renderData: "18, 42, 27, 64, 33, 75, 52, 91, 46, 68",
  renderWatermark: "KAI STUDIO",
  renderBackgroundMusicUrl: "",
  renderVoiceVolume: 0.9,
  renderBackgroundMusicVolume: 0.22,
};

export const DEFAULT_FORM: AgentVideoForm = {
  topic: "Bubble Sort explained visually",
  kind: "algorithm",
  platform: "youtube-short",
  language: "vi",
  tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts",
  targetDurationSec: 45,
  extraInstruction: "Tập trung vào hình ảnh trực quan, tránh nói quá học thuật.",
  voiceProvider: "piper",
  piperModelKey: "vi_vais1000",
  elevenModelId: "eleven_flash_v2_5",
  elevenVoiceId: "",
  supertonicVoice: "M1",
  supertonicTotalSteps: 8,
  vieneuVoiceId: "",
  vieneuMode: "turbo",
  vieneuEmotion: "natural",
  applioTtsTemplateId: "",
  speechRate: 0.9,
  sentenceSilence: 0.25,
  ...BASE_RENDER_DEFAULTS,
  agentPreset: "algorithm-shorts",
  autoCreatePublishJobs: false,
  publishTargets: ["youtube"],
  publishChannels: [],
  publishPrivacyStatus: "private",
  publishScheduledAt: "",
};

export const KIND_DEFAULTS: Record<AgentVideoForm["kind"], Partial<AgentVideoForm>> = {
  algorithm: {
    agentPreset: "algorithm-shorts",
    topic: "Bubble Sort explained visually",
    platform: "youtube-short",
    language: "vi",
    tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts",
    targetDurationSec: 45,
    extraInstruction: "Tập trung vào hình ảnh trực quan, tránh nói quá học thuật.",
    ...getAgentRenderDefaults({ kind: "algorithm", agentPreset: "algorithm-shorts" }),
  },
  football: {
    agentPreset: "mu-news",
    topic: "Tin mới Manchester United",
    platform: "youtube-short",
    language: "vi",
    tone: "Nhiệt, gãy gọn, hơi bình luận bóng đá, không giật tít quá đà.",
    targetDurationSec: 55,
    extraInstruction: "Không bịa số liệu chuyển nhượng. Nếu thiếu nguồn thì ghi cần kiểm chứng.",
    ...getAgentRenderDefaults({ kind: "football", agentPreset: "mu-news" }),
  },
  story: {
    agentPreset: "story-video",
    topic: "Một câu chuyện ngắn có cao trào cuối",
    platform: "youtube-short",
    language: "vi",
    tone: "Kể chuyện lôi cuốn, giàu hình ảnh, có cao trào cuối.",
    targetDurationSec: 60,
    extraInstruction: "Tạo narration tự nhiên để đọc voice-over, tránh câu quá dài.",
    ...getAgentRenderDefaults({ kind: "story", agentPreset: "story-video" }),
  },
  generic: {
    agentPreset: "custom",
    topic: "Một video giải thích trực quan",
    platform: "youtube-short",
    language: "vi",
    tone: "Dễ hiểu, tự nhiên, nhịp vừa phải.",
    targetDurationSec: 45,
    extraInstruction: "",
    ...getAgentRenderDefaults({ kind: "generic", agentPreset: "custom" }),
  },
};

export const TERMINAL_JOB_STATUSES = new Set(["success", "failed", "cancelled", "review_ready"]);

export function getAgentRenderDefaults(input: { kind?: AgentVideoForm["kind"]; agentPreset?: string; platform?: AgentVideoForm["platform"] }) {
  const preset = input.agentPreset || "";
  if (input.kind === "story" || preset.startsWith("story")) {
    return {
      ...BASE_RENDER_DEFAULTS,
      renderTemplate: "story-card" as const,
      renderAlgorithmLabel: "Story",
      renderAccentColor: "#f97316",
    };
  }
  if (input.kind === "football" || preset === "mu-news" || preset === "github-trending") {
    return {
      ...BASE_RENDER_DEFAULTS,
      renderTemplate: "news-card" as const,
      renderAlgorithmLabel: preset === "github-trending" ? "GitHub Trend" : "MU News",
      renderAccentColor: preset === "github-trending" ? "#22c55e" : "#ef4444",
    };
  }
  return {
    ...BASE_RENDER_DEFAULTS,
    renderTemplate: "algorithm-explainer" as const,
    renderAlgorithmLabel: preset === "maze-pathfinding" ? "Pathfinding" : "Bubble Sort",
    renderAspectRatio: input.platform === "youtube-long" ? "16:9" as const : "auto" as const,
  };
}
