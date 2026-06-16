export type RemotionVideoAspectRatio = "16:9" | "9:16";
export type RemotionVideoTemplate = "algorithm-explainer" | "news-card" | "story-card";

export type RemotionVideoInputProps = {
  title: string;
  subtitle: string;
  template: RemotionVideoTemplate;
  aspectRatio: RemotionVideoAspectRatio;
  durationSeconds: number;
  fps: number;
  primaryColor: string;
  accentColor: string;
  algorithmLabel: string;
  data: number[];
  narration: string;
  watermark: string;
  voiceAudioUrl: string;
  backgroundMusicUrl: string;
  voiceVolume: number;
  backgroundMusicVolume: number;
};

export type RemotionRenderResponse = {
  ok: boolean;
  engine: "remotion";
  fileName: string;
  relativePath: string;
  videoUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
};

export type RemotionHealthResponse = {
  ok: boolean;
  available: boolean;
  packageOk: boolean;
  rendererPackageOk: boolean;
  bundlerPackageOk: boolean;
  playerPackageOk: boolean;
  entryPoint: string;
  entryPointExists: boolean;
  outputDir: string;
  outputDirExists: boolean;
  message?: string;
};

export const DEFAULT_REMOTION_VIDEO: RemotionVideoInputProps = {
  title: "Bubble Sort Explained Visually",
  subtitle: "A clean React-powered video template rendered with Remotion.",
  template: "algorithm-explainer",
  aspectRatio: "16:9",
  durationSeconds: 18,
  fps: 30,
  primaryColor: "#020617",
  accentColor: "#38bdf8",
  algorithmLabel: "Bubble Sort",
  data: [18, 42, 27, 64, 33, 75, 52, 91, 46, 68],
  narration: "Use Remotion for template-based videos, subtitles, scene timelines, and long-form renders. Keep Canvas export for fast algorithm Shorts.",
  watermark: "KAI STUDIO",
  voiceAudioUrl: "",
  backgroundMusicUrl: "",
  voiceVolume: 0.9,
  backgroundMusicVolume: 0.22,
};

export function getRemotionDimensions(aspectRatio: RemotionVideoAspectRatio) {
  return aspectRatio === "9:16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
}

export function normalizeRemotionVideoInput(raw: Partial<RemotionVideoInputProps>): RemotionVideoInputProps {
  const aspectRatio = raw.aspectRatio === "9:16" ? "9:16" : "16:9";
  const template = raw.template === "news-card" || raw.template === "story-card" ? raw.template : "algorithm-explainer";
  return {
    ...DEFAULT_REMOTION_VIDEO,
    ...raw,
    template,
    aspectRatio,
    title: sanitizeText(raw.title, DEFAULT_REMOTION_VIDEO.title, 96),
    subtitle: sanitizeText(raw.subtitle, DEFAULT_REMOTION_VIDEO.subtitle, 160),
    algorithmLabel: sanitizeText(raw.algorithmLabel, DEFAULT_REMOTION_VIDEO.algorithmLabel, 80),
    narration: sanitizeText(raw.narration, DEFAULT_REMOTION_VIDEO.narration, 600),
    watermark: sanitizeText(raw.watermark, DEFAULT_REMOTION_VIDEO.watermark, 48),
    voiceAudioUrl: sanitizeMediaUrl(raw.voiceAudioUrl),
    backgroundMusicUrl: sanitizeMediaUrl(raw.backgroundMusicUrl),
    voiceVolume: clampNumber(raw.voiceVolume, 0, 1, DEFAULT_REMOTION_VIDEO.voiceVolume),
    backgroundMusicVolume: clampNumber(raw.backgroundMusicVolume, 0, 1, DEFAULT_REMOTION_VIDEO.backgroundMusicVolume),
    primaryColor: sanitizeColor(raw.primaryColor, DEFAULT_REMOTION_VIDEO.primaryColor),
    accentColor: sanitizeColor(raw.accentColor, DEFAULT_REMOTION_VIDEO.accentColor),
    durationSeconds: clampNumber(raw.durationSeconds, 5, 600, DEFAULT_REMOTION_VIDEO.durationSeconds),
    fps: clampNumber(raw.fps, 24, 60, DEFAULT_REMOTION_VIDEO.fps),
    data: normalizeData(raw.data),
  };
}

function sanitizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function sanitizeMediaUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^(https?:|data:|blob:|\/)/i.test(trimmed) ? trimmed : "";
}

function sanitizeColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeData(value: unknown) {
  const source = Array.isArray(value) ? value : DEFAULT_REMOTION_VIDEO.data;
  const normalized = source
    .map((item) => Math.round(Number(item)))
    .filter((item) => Number.isFinite(item))
    .slice(0, 18);
  return normalized.length >= 3 ? normalized.map((item) => Math.min(100, Math.max(5, item))) : DEFAULT_REMOTION_VIDEO.data;
}
