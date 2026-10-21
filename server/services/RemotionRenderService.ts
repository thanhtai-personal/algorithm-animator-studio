import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { NormalizedRemotionVideoInput, RemotionVideoRenderBody } from "../models/RemotionVideo";
import { getGeneratedVideoDir } from "../config/paths";
import type { RuntimeEnvValues } from "./EnvFileService";
import { readEnvValues } from "./EnvFileService";
import { createVideoOutput } from "../utils/videoOutput";

const require = createRequire(import.meta.url);
const COMPOSITION_ID = "AlgorithmExplainer";
export const REMOTION_ENTRY_POINT = path.resolve(process.cwd(), "src/features/remotion-video/remotion/index.ts");
const DEFAULT_INPUT: NormalizedRemotionVideoInput = {
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

let cachedBundle: { entryMtimeMs: number; serveUrl: string } | null = null;

export async function renderRemotionVideo(params: {
  input: RemotionVideoRenderBody;
  envOverrides?: RuntimeEnvValues;
}) {
  const inputProps = normalizeRemotionVideoInput(params.input);
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await getRemotionBundleUrl(bundle);
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });
  const output = createVideoOutput(inputProps.title, params.envOverrides);

  await renderMedia({
    codec: "h264",
    composition,
    serveUrl,
    inputProps,
    outputLocation: output.outputPath,
  });

  if (!fs.existsSync(output.outputPath)) throw new Error("Remotion render xong nhưng không tạo tệp MP4.");

  return {
    ok: true,
    engine: "remotion" as const,
    fileName: output.outputFileName,
    relativePath: output.relativePath,
    videoUrl: output.videoUrl,
    durationSeconds: inputProps.durationSeconds,
    width: composition.width,
    height: composition.height,
  };
}

export function getRemotionHealth(envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const outputDir = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const packageOk = canResolve("remotion");
  const rendererPackageOk = canResolve("@remotion/renderer");
  const bundlerPackageOk = canResolve("@remotion/bundler");
  const playerPackageOk = canResolve("@remotion/player");
  const entryPointExists = fs.existsSync(REMOTION_ENTRY_POINT);
  const outputDirExists = fs.existsSync(outputDir);
  const available = packageOk && rendererPackageOk && bundlerPackageOk && playerPackageOk && entryPointExists && outputDirExists;

  return {
    ok: true,
    available,
    packageOk,
    rendererPackageOk,
    bundlerPackageOk,
    playerPackageOk,
    entryPoint: REMOTION_ENTRY_POINT,
    entryPointExists,
    outputDir,
    outputDirExists,
    message: available ? "Remotion render engine is ready." : "Cần chạy npm install và kiểm tra entry point Remotion.",
  };
}

function canResolve(packageName: string) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

export async function getRemotionBundleUrl(bundleOverride?: (options: { entryPoint: string; onProgress?: (progress: number) => void }) => Promise<string>) {
  if (!fs.existsSync(REMOTION_ENTRY_POINT)) throw new Error(`Không tìm thấy Remotion entry point: ${REMOTION_ENTRY_POINT}`);
  const entryMtimeMs = getDirectoryMtimeMs(path.dirname(REMOTION_ENTRY_POINT));
  if (cachedBundle && cachedBundle.entryMtimeMs === entryMtimeMs) return cachedBundle.serveUrl;

  const bundle = bundleOverride ?? (await import("@remotion/bundler")).bundle;
  const serveUrl = await bundle({
    entryPoint: REMOTION_ENTRY_POINT,
    onProgress: (progress) => console.log(`Remotion bundle ${Math.round(progress * 100)}%`),
  });
  cachedBundle = { entryMtimeMs, serveUrl };
  return serveUrl;
}

function getDirectoryMtimeMs(directory: string): number {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((latest, entry) => {
    const fullPath = path.join(directory, entry.name);
    const stat = fs.statSync(fullPath);
    if (entry.isDirectory()) return Math.max(latest, getDirectoryMtimeMs(fullPath));
    return Math.max(latest, stat.mtimeMs);
  }, 0);
}

function normalizeRemotionVideoInput(raw: RemotionVideoRenderBody): NormalizedRemotionVideoInput {
  return {
    ...DEFAULT_INPUT,
    ...raw,
    template: raw.template === "news-card" || raw.template === "story-card" ? raw.template : "algorithm-explainer",
    aspectRatio: raw.aspectRatio === "9:16" ? "9:16" : "16:9",
    title: sanitizeText(raw.title, DEFAULT_INPUT.title, 96),
    subtitle: sanitizeText(raw.subtitle, DEFAULT_INPUT.subtitle, 160),
    algorithmLabel: sanitizeText(raw.algorithmLabel, DEFAULT_INPUT.algorithmLabel, 80),
    narration: sanitizeText(raw.narration, DEFAULT_INPUT.narration, 600),
    watermark: sanitizeText(raw.watermark, DEFAULT_INPUT.watermark, 48),
    voiceAudioUrl: sanitizeMediaUrl(raw.voiceAudioUrl),
    backgroundMusicUrl: sanitizeMediaUrl(raw.backgroundMusicUrl),
    voiceVolume: clampNumber(raw.voiceVolume, 0, 1, DEFAULT_INPUT.voiceVolume),
    backgroundMusicVolume: clampNumber(raw.backgroundMusicVolume, 0, 1, DEFAULT_INPUT.backgroundMusicVolume),
    primaryColor: sanitizeColor(raw.primaryColor, DEFAULT_INPUT.primaryColor),
    accentColor: sanitizeColor(raw.accentColor, DEFAULT_INPUT.accentColor),
    durationSeconds: clampNumber(raw.durationSeconds, 5, 600, DEFAULT_INPUT.durationSeconds),
    fps: clampNumber(raw.fps, 24, 60, DEFAULT_INPUT.fps),
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
  const source = Array.isArray(value) ? value : DEFAULT_INPUT.data;
  const normalized = source
    .map((item) => Math.round(Number(item)))
    .filter((item) => Number.isFinite(item))
    .slice(0, 18);
  return normalized.length >= 3 ? normalized.map((item) => Math.min(100, Math.max(5, item))) : DEFAULT_INPUT.data;
}
