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
} from "../models/PresetVideo";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { runFfmpeg } from "../utils/ffmpeg";
import type { RuntimeEnvValues } from "./EnvFileService";
import { readEnvValues } from "./EnvFileService";
import { downloadYoutubeVideo } from "./YoutubeToolsService";

const MAX_PRESET_VIDEO_SOURCES = 12;
const MAX_CLIP_SECONDS = 20;

export type PresetMediaProgress = {
  progress: number;
  message: string;
};

export async function preparePresetVideoMedia(params: {
  presetId: string;
  videoSources: PresetVideoSourceClipRequest[] | NormalizedPresetVideoSourceClip[];
  envOverrides?: RuntimeEnvValues;
  onProgress?: (event: PresetMediaProgress) => void;
}) {
  const presetId = normalizePresetId(params.presetId);
  const sources = normalizePresetVideoSources(params.videoSources);
  if (!sources.length) return { presetId, videoSourceUrls: {} as Record<string, string> };

  const env = readEnvValues(params.envOverrides);
  const outputRoot = getGeneratedVideoDir(env.SERVER_DATA_DIR);
  const relativeDir = path.posix.join("preset-clips", presetId);
  const outputDir = path.join(outputRoot, ...relativeDir.split("/"));
  ensureDirectoryExists(outputDir);

  const videoSourceUrls: Record<string, string> = {};
  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    const cacheName = buildCacheName(source);
    const outputPath = path.join(outputDir, `${cacheName}.mp4`);
    params.onProgress?.({
      progress: index / sources.length,
      message: fs.existsSync(outputPath)
        ? `Đang dùng clip nền đã cache (${index + 1}/${sources.length})...`
        : `Đang tải trích đoạn video nền (${index + 1}/${sources.length})...`,
    });

    if (!fs.existsSync(outputPath)) {
      const downloaded = await downloadYoutubeVideo({
        url: source.watchUrl,
        mode: "video",
        maxHeight: 720,
        fileName: `preset-${presetId}-${source.id}`,
        sectionStartSeconds: source.clipStartSeconds,
        sectionEndSeconds: source.clipEndSeconds,
      }, params.envOverrides);

      try {
        await runFfmpeg([
          "-y",
          "-i", downloaded.savedTo,
          "-map", "0:v:0",
          "-an",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "20",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          outputPath,
        ], params.envOverrides);
      } finally {
        fs.rmSync(downloaded.savedTo, { force: true });
      }
    }

    const relativePath = path.posix.join(relativeDir, `${cacheName}.mp4`);
    videoSourceUrls[source.id] = buildGeneratedFileUrl(
      GENERATED_VIDEO_PUBLIC_PATH,
      relativePath,
      env.SERVER_ORIGIN || SERVER_ORIGIN,
    );
    params.onProgress?.({
      progress: (index + 1) / sources.length,
      message: `Đã chuẩn bị ${index + 1}/${sources.length} clip nền.`,
    });
  }

  return { presetId, videoSourceUrls };
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
