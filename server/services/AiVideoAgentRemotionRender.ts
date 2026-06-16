import type {
  AgentVideoJob,
  AgentVideoPlatform,
  AgentVideoRenderAspectRatio,
  AgentVideoRenderTemplate,
  CreateAgentVideoJobBody,
} from "../models/AiVideoAgent";
import type { RemotionVideoAspectRatio, RemotionVideoRenderBody } from "../models/RemotionVideo";

const DEFAULT_RENDER_DATA = "18, 42, 27, 64, 33, 75, 52, 91, 46, 68";

export function normalizeAgentRenderSettings(body: Partial<CreateAgentVideoJobBody>) {
  return {
    renderTitle: cleanText(body.renderTitle, 96),
    renderSubtitle: cleanText(body.renderSubtitle, 160),
    renderNarration: cleanText(body.renderNarration, 600),
    renderTemplate: normalizeTemplate(body.renderTemplate, body.kind, body.agentPreset),
    renderAspectRatio: normalizeRenderAspectRatio(body.renderAspectRatio),
    renderFps: clampNumber(body.renderFps, 24, 60, 30),
    renderPrimaryColor: sanitizeColor(body.renderPrimaryColor, "#020617"),
    renderAccentColor: sanitizeColor(body.renderAccentColor, defaultAccentColor(body.kind, body.agentPreset)),
    renderAlgorithmLabel: cleanText(body.renderAlgorithmLabel, 80) || defaultAlgorithmLabel(body.kind, body.agentPreset),
    renderData: cleanText(body.renderData, 180) || DEFAULT_RENDER_DATA,
    renderWatermark: cleanText(body.renderWatermark, 48) || "KAI STUDIO",
    renderBackgroundMusicUrl: sanitizeMediaUrl(body.renderBackgroundMusicUrl),
    renderVoiceVolume: clampNumber(body.renderVoiceVolume, 0, 1, 0.9),
    renderBackgroundMusicVolume: clampNumber(body.renderBackgroundMusicVolume, 0, 1, 0.22),
  };
}

export function buildAgentRemotionVideoInput(params: { job: Pick<AgentVideoJob, "input" | "plan" | "artifacts">; narration: string }): RemotionVideoRenderBody {
  const { job, narration } = params;
  return {
    title: firstText(job.input.renderTitle, job.plan?.title, job.input.topic),
    subtitle: firstText(job.input.renderSubtitle, job.plan?.hook, job.plan?.description, job.input.extraInstruction),
    template: job.input.renderTemplate,
    aspectRatio: resolveAspectRatio(job.input.renderAspectRatio, job.input.platform),
    durationSeconds: job.input.targetDurationSec,
    fps: clampNumber(job.input.renderFps, 24, 60, 30),
    primaryColor: sanitizeColor(job.input.renderPrimaryColor, "#020617"),
    accentColor: sanitizeColor(job.input.renderAccentColor, "#38bdf8"),
    algorithmLabel: firstText(job.input.renderAlgorithmLabel, defaultAlgorithmLabel(job.input.kind, job.input.agentPreset), job.input.topic),
    data: parseRenderData(job.input.renderData),
    narration: firstText(job.input.renderNarration, narration, job.plan?.hook, job.input.topic),
    watermark: firstText(job.input.renderWatermark, "KAI STUDIO"),
    voiceAudioUrl: sanitizeMediaUrl(job.artifacts?.audioUrl),
    backgroundMusicUrl: sanitizeMediaUrl(job.input.renderBackgroundMusicUrl),
    voiceVolume: clampNumber(job.input.renderVoiceVolume, 0, 1, 0.9),
    backgroundMusicVolume: clampNumber(job.input.renderBackgroundMusicVolume, 0, 1, 0.22),
  };
}

function normalizeTemplate(value: unknown, kind?: string, agentPreset?: string): AgentVideoRenderTemplate {
  if (value === "news-card" || value === "story-card" || value === "algorithm-explainer") return value;
  if (kind === "story" || String(agentPreset || "").startsWith("story")) return "story-card";
  if (kind === "football" || agentPreset === "mu-news" || agentPreset === "github-trending") return "news-card";
  return "algorithm-explainer";
}

function normalizeRenderAspectRatio(value: unknown): AgentVideoRenderAspectRatio {
  return value === "16:9" || value === "9:16" ? value : "auto";
}

function resolveAspectRatio(value: AgentVideoRenderAspectRatio, platform: AgentVideoPlatform): RemotionVideoAspectRatio {
  if (value === "16:9" || value === "9:16") return value;
  return platform === "youtube-long" ? "16:9" : "9:16";
}

function parseRenderData(value: string) {
  const normalized = String(value || DEFAULT_RENDER_DATA)
    .split(/[,\s]+/)
    .map((item) => Math.round(Number(item)))
    .filter((item) => Number.isFinite(item))
    .slice(0, 18)
    .map((item) => Math.min(100, Math.max(5, item)));
  return normalized.length >= 3 ? normalized : undefined;
}

function defaultAlgorithmLabel(kind?: string, agentPreset?: string) {
  if (agentPreset === "github-trending") return "GitHub Trend";
  if (agentPreset === "maze-pathfinding") return "Pathfinding";
  if (kind === "football" || agentPreset === "mu-news") return "MU News";
  if (kind === "story" || String(agentPreset || "").startsWith("story")) return "Story";
  return "Bubble Sort";
}

function defaultAccentColor(kind?: string, agentPreset?: string) {
  if (agentPreset === "github-trending") return "#22c55e";
  if (kind === "football" || agentPreset === "mu-news") return "#ef4444";
  if (kind === "story" || String(agentPreset || "").startsWith("story")) return "#f97316";
  return "#38bdf8";
}

function firstText(...values: Array<string | undefined>) {
  for (const value of values) {
    const cleaned = cleanText(value, 600);
    if (cleaned) return cleaned;
  }
  return "";
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeMediaUrl(value: unknown) {
  const cleaned = cleanText(value, 600);
  if (!cleaned) return "";
  return /^(https?:|data:|blob:|\/)/i.test(cleaned) ? cleaned : "";
}

function sanitizeColor(value: unknown, fallback: string) {
  const cleaned = cleanText(value, 16);
  return /^#[0-9a-f]{6}$/i.test(cleaned) ? cleaned : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
