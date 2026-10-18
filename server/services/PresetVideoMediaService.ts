import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_VIDEO_PUBLIC_PATH,
  SERVER_ORIGIN,
  buildGeneratedFileUrl,
  getGeneratedVideoDir,
} from "../config/paths";
import type {
  NormalizedPresetVideoSourceClip,
  PresetVideoSourceClipRequest,
  PresetVideoSourceStrategy,
} from "../models/PresetVideo";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { runFfmpeg, runFfprobe } from "../utils/ffmpeg";
import type { RuntimeEnvValues } from "./EnvFileService";
import { readEnvValues } from "./EnvFileService";
import { downloadYoutubeVideo } from "./YoutubeToolsService";

const MAX_PRESET_VIDEO_SOURCES = 32;
const MAX_CLIP_SECONDS = 20;

export type PresetMediaProgress = {
  progress: number;
  message: string;
};

export async function preparePresetVideoMedia(params: {
  presetId: string;
  videoSources: PresetVideoSourceClipRequest[] | NormalizedPresetVideoSourceClip[];
  videoSourceStrategy?: PresetVideoSourceStrategy;
  envOverrides?: RuntimeEnvValues;
  onProgress?: (event: PresetMediaProgress) => void;
}) {
  const presetId = normalizePresetId(params.presetId);
  const sources = normalizePresetVideoSources(params.videoSources);
  if (!sources.length) {
    return { presetId, videoSourceUrls: {} as Record<string, string>, missingSourceIds: [] as string[] };
  }

  const strategy = normalizePresetVideoSourceStrategy(params.videoSourceStrategy);
  const cache = resolvePresetCache(presetId, params.envOverrides);
  const videoSourceUrls: Record<string, string> = {};
  const missingSourceIds: string[] = [];

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    const cached = resolveCachedSource(cache, source);
    const hasCachedClip = fs.existsSync(cached.outputPath);

    params.onProgress?.({
      progress: index / sources.length,
      message: hasCachedClip
        ? `Đang dùng clip nền đã cache (${index + 1}/${sources.length})...`
        : strategy === "local"
          ? `Đang kiểm tra video local (${index + 1}/${sources.length})...`
          : `Đang tải trích đoạn video nền (${index + 1}/${sources.length})...`,
    });

    if (!hasCachedClip && strategy === "remote") {
      await downloadRemoteSourceClip({
        presetId,
        source,
        outputPath: cached.outputPath,
        envOverrides: params.envOverrides,
      });
    }

    if (fs.existsSync(cached.outputPath)) {
      videoSourceUrls[source.id] = cached.videoUrl;
    } else {
      missingSourceIds.push(source.id);
    }

    params.onProgress?.({
      progress: (index + 1) / sources.length,
      message: missingSourceIds.includes(source.id)
        ? `Thiếu clip local ${index + 1}/${sources.length}.`
        : `Đã chuẩn bị ${index + 1}/${sources.length} clip nền.`,
    });
  }

  return { presetId, videoSourceUrls, missingSourceIds };
}

export async function importPresetVideoSource(params: {
  presetId: string;
  source: PresetVideoSourceClipRequest;
  inputPath: string;
  stillImage?: boolean;
  envOverrides?: RuntimeEnvValues;
}) {
  const result = await importPresetVideoSources({
    presetId: params.presetId,
    sources: [params.source],
    inputPath: params.inputPath,
    stillImage: params.stillImage,
    envOverrides: params.envOverrides,
  });
  const source = result.sources[0];
  if (!source) throw new Error("Thông tin clip preset không hợp lệ.");
  return { presetId: result.presetId, sourceId: source.sourceId, videoUrl: source.videoUrl };
}

export async function importPresetVideoSources(params: {
  presetId: string;
  sources: PresetVideoSourceClipRequest[];
  inputPath: string;
  stillImage?: boolean;
  envOverrides?: RuntimeEnvValues;
}) {
  const presetId = normalizePresetId(params.presetId);
  const sources = normalizePresetVideoSources(params.sources);
  if (!sources.length) throw new Error("Chưa có trích đoạn preset để xử lý.");

  const inputDuration = params.stillImage ? Number.POSITIVE_INFINITY : await getMediaDurationSeconds(params.inputPath, params.envOverrides);
  const cache = resolvePresetCache(presetId, params.envOverrides);
  const imported: Array<{ sourceId: string; videoUrl: string }> = [];

  for (const source of sources) {
    if (params.stillImage && source.clipStartSeconds !== 0) throw new Error("Ảnh tĩnh phải bắt đầu từ giây 0.");
    if (inputDuration + 0.05 < source.clipEndSeconds) {
      throw new Error(
        `Video "${source.id}" chỉ dài ${formatSeconds(inputDuration)}, cần ít nhất ${formatSeconds(source.clipEndSeconds)} để cắt đoạn ${formatSeconds(source.clipStartSeconds)}–${formatSeconds(source.clipEndSeconds)}.`,
      );
    }

    const cached = resolveCachedSource(cache, source);
    const tempOutputPath = `${cached.outputPath}.${process.pid}-${Date.now()}.tmp.mp4`;

    try {
      await transcodeSourceClip({
        inputPath: params.inputPath,
        outputPath: tempOutputPath,
        startSeconds: source.clipStartSeconds,
        durationSeconds: source.clipEndSeconds - source.clipStartSeconds,
        stillImage: params.stillImage,
        envOverrides: params.envOverrides,
      });
      fs.rmSync(cached.outputPath, { force: true });
      fs.renameSync(tempOutputPath, cached.outputPath);
      imported.push({ sourceId: source.id, videoUrl: cached.videoUrl });
    } finally {
      fs.rmSync(tempOutputPath, { force: true });
    }
  }

  return { presetId, sources: imported };
}

export function normalizePresetVideoSources(value: unknown): NormalizedPresetVideoSourceClip[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_PRESET_VIDEO_SOURCES).map((raw, index) => {
    const source = raw && typeof raw === "object" ? raw as PresetVideoSourceClipRequest : {};
    const id = String(source.id || "").trim();
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(id)) {
      throw new Error(`Video source #${index + 1} có id không hợp lệ.`);
    }

    const watchUrl = String(source.watchUrl || "").trim();
    const clipStartSeconds = clampNumber(source.clipStartSeconds, 0, 4 * 60 * 60, 0);
    const clipEndSeconds = clampNumber(source.clipEndSeconds, clipStartSeconds + 0.5, 4 * 60 * 60, clipStartSeconds + 8);
    if (clipEndSeconds - clipStartSeconds > MAX_CLIP_SECONDS) {
      throw new Error(`Video source "${id}" vượt quá ${MAX_CLIP_SECONDS} giây.`);
    }

    return { id, watchUrl, clipStartSeconds, clipEndSeconds };
  });
}

export function normalizePresetVideoSourceStrategy(value: unknown): PresetVideoSourceStrategy {
  return value === "local" ? "local" : "remote";
}

async function downloadRemoteSourceClip(params: {
  presetId: string;
  source: NormalizedPresetVideoSourceClip;
  outputPath: string;
  envOverrides?: RuntimeEnvValues;
}) {
  const downloaded = await downloadYoutubeVideo({
    url: params.source.watchUrl,
    mode: "video",
    maxHeight: 720,
    fileName: `preset-${params.presetId}-${params.source.id}`,
    sectionStartSeconds: params.source.clipStartSeconds,
    sectionEndSeconds: params.source.clipEndSeconds,
  }, params.envOverrides);

  try {
    await transcodeSourceClip({
      inputPath: downloaded.savedTo,
      outputPath: params.outputPath,
      startSeconds: 0,
      durationSeconds: params.source.clipEndSeconds - params.source.clipStartSeconds,
      envOverrides: params.envOverrides,
    });
  } finally {
    fs.rmSync(downloaded.savedTo, { force: true });
  }
}

async function transcodeSourceClip(params: {
  inputPath: string;
  outputPath: string;
  startSeconds: number;
  durationSeconds: number;
  stillImage?: boolean;
  envOverrides?: RuntimeEnvValues;
}) {
  await runFfmpeg([
    "-y",
    ...(params.stillImage
      ? ["-loop", "1", "-framerate", "30", "-i", params.inputPath]
      : ["-ss", params.startSeconds.toFixed(3), "-i", params.inputPath]),
    "-t", params.durationSeconds.toFixed(3),
    "-map", "0:v:0",
    "-an",
    "-vf", "fps=30,scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-g", "30",
    "-keyint_min", "30",
    "-sc_threshold", "0",
    "-movflags", "+faststart",
    params.outputPath,
  ], params.envOverrides);
}

async function getMediaDurationSeconds(inputPath: string, envOverrides?: RuntimeEnvValues) {
  const formatProbe = await runFfprobe([
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ], envOverrides);
  const formatDuration = Number.parseFloat(formatProbe.stdout.trim());
  if (Number.isFinite(formatDuration) && formatDuration > 0) return formatDuration;

  const packetProbe = await runFfprobe([
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "packet=pts_time,duration_time",
    "-of", "csv=p=0",
    inputPath,
  ], envOverrides);
  const packetDuration = packetProbe.stdout
    .trim()
    .split(/\r?\n/)
    .reduce((max, line) => {
      const [ptsRaw, durationRaw] = line.split(",");
      const pts = Number.parseFloat(ptsRaw);
      const packetLength = Number.parseFloat(durationRaw);
      if (!Number.isFinite(pts)) return max;
      return Math.max(max, pts + (Number.isFinite(packetLength) ? packetLength : 0));
    }, 0);

  if (packetDuration > 0) return packetDuration;
  throw new Error("Không đọc được thời lượng video local bằng FFprobe.");
}

function resolvePresetCache(presetId: string, envOverrides?: RuntimeEnvValues) {
  const env = readEnvValues(envOverrides);
  const outputRoot = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const relativeDir = path.posix.join("preset-clips", presetId);
  const outputDir = path.join(outputRoot, ...relativeDir.split("/"));
  ensureDirectoryExists(outputDir);
  return {
    outputDir,
    relativeDir,
    origin: env.SERVER_ORIGIN || SERVER_ORIGIN,
  };
}

function resolveCachedSource(
  cache: ReturnType<typeof resolvePresetCache>,
  source: NormalizedPresetVideoSourceClip,
) {
  const cacheName = buildCacheName(source);
  const relativePath = path.posix.join(cache.relativeDir, `${cacheName}.mp4`);
  return {
    outputPath: path.join(cache.outputDir, `${cacheName}.mp4`),
    videoUrl: buildGeneratedFileUrl(GENERATED_VIDEO_PUBLIC_PATH, relativePath, cache.origin),
  };
}

function buildCacheName(source: NormalizedPresetVideoSourceClip) {
  return `${source.id}-${Math.round(source.clipStartSeconds * 1000)}-${Math.round(source.clipEndSeconds * 1000)}`;
}

function normalizePresetId(value: string) {
  const presetId = String(value || "").trim();
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(presetId)) throw new Error("Preset id không hợp lệ.");
  return presetId;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}
