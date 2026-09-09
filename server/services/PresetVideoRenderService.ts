import fs from "node:fs";
import type {
  NormalizedPresetVideoRenderInput,
  PresetVideoAspectRatio,
  PresetVideoOutputPreset,
  PresetVideoRenderBody,
} from "../models/PresetVideo";
import { SERVER_ORIGIN } from "../config/paths";
import { createVideoOutput } from "../utils/videoOutput";
import type { RuntimeEnvValues } from "./EnvFileService";
import {
  normalizePresetVideoSources,
  normalizePresetVideoSourceStrategy,
  preparePresetVideoMedia,
} from "./PresetVideoMediaService";
import { getRemotionBundleUrl } from "./RemotionRenderService";

const COMPOSITION_ID = "PresetVideo";
const MAX_PRESET_DURATION_SECONDS = 30 * 60;
const OUTPUT_SIZES: Record<PresetVideoOutputPreset, { width: number; height: number; aspectRatio: PresetVideoAspectRatio }> = {
  "landscape-1080p": { width: 1920, height: 1080, aspectRatio: "16:9" },
  "landscape-720p": { width: 1280, height: 720, aspectRatio: "16:9" },
  "portrait-1080p": { width: 1080, height: 1920, aspectRatio: "9:16" },
  "portrait-720p": { width: 720, height: 1280, aspectRatio: "9:16" },
  "square-1080p": { width: 1080, height: 1080, aspectRatio: "1:1" },
};

export type PresetVideoRenderProgress = {
  progress: number;
  stage: "preparing" | "metadata" | "rendering" | "muxing" | "verifying";
  message: string;
};

export async function renderPresetVideo(params: {
  input: PresetVideoRenderBody;
  envOverrides?: RuntimeEnvValues;
  onProgress?: (event: PresetVideoRenderProgress) => void;
}) {
  const input = normalizePresetVideoRenderInput(params.input);
  let lastProgress = -1;
  const report = (event: PresetVideoRenderProgress) => {
    const progress = Math.max(lastProgress, Math.max(0, Math.min(1, event.progress)));
    lastProgress = progress;
    params.onProgress?.({ ...event, progress });
  };

  report({ progress: 0.01, stage: "preparing", message: "Đang chuẩn bị clip video nền..." });
  const mediaSources = [
    ...input.videoSources,
    ...input.timelineVideoClips.map((clip) => ({
      id: clip.id,
      watchUrl: clip.watchUrl,
      clipStartSeconds: clip.clipStartSeconds,
      clipEndSeconds: clip.clipEndSeconds,
    })),
  ];
  const media = await preparePresetVideoMedia({
    presetId: input.presetId,
    videoSources: mediaSources,
    videoSourceStrategy: input.videoSourceStrategy,
    envOverrides: params.envOverrides,
    onProgress: (event) => report({
      progress: 0.01 + event.progress * 0.11,
      stage: "preparing",
      message: event.message,
    }),
  });

  if (input.videoSourceStrategy === "local" && media.missingSourceIds.length) {
    throw new Error(
      `Còn thiếu ${media.missingSourceIds.length} video local: ${media.missingSourceIds.join(", ")}. Hãy chọn đủ video nguồn trước khi export.`,
    );
  }

  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  report({ progress: 0.13, stage: "metadata", message: "Đang đọc composition preset..." });
  const serveUrl = await getRemotionBundleUrl();
  const inputProps = {
    presetId: input.presetId,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    fps: input.fps,
    backgroundMusicUrl: input.backgroundMusicUrl,
    backgroundMusicVolume: input.backgroundMusicVolume,
    originalAudioVolume: input.originalAudioVolume,
    lyricTimings: input.lyricTimings,
    videoSourceUrls: media.videoSourceUrls,
    timelineVideoClips: input.timelineVideoClips,
  };
  const selectedComposition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });
  const composition = {
    ...selectedComposition,
    width: input.width,
    height: input.height,
  };
  const startFrame = Math.max(0, Math.floor(input.trimStartSeconds * input.fps));
  const endFrame = Math.min(
    composition.durationInFrames - 1,
    Math.max(startFrame, Math.ceil(input.trimEndSeconds * input.fps) - 1),
  );
  const output = createVideoOutput(input.fileName || input.presetId, params.envOverrides);

  report({ progress: 0.15, stage: "rendering", message: "Bắt đầu render MP4..." });
  await renderMedia({
    codec: "h264",
    composition,
    serveUrl,
    inputProps,
    outputLocation: output.outputPath,
    frameRange: [startFrame, endFrame],
    onProgress: ({ progress, stitchStage, renderedFrames, encodedFrames }) => {
      const normalized = Math.max(0, Math.min(1, progress));
      const stage = stitchStage === "muxing" ? "muxing" : "rendering";
      report({
        progress: 0.15 + normalized * 0.8,
        stage,
        message: stage === "muxing"
          ? `Đang ghép MP4 ${Math.round(normalized * 100)}%...`
          : `Đang render ${Math.round(normalized * 100)}% · ${renderedFrames} frame render / ${encodedFrames} frame encode`,
      });
    },
  });

  report({ progress: 0.97, stage: "verifying", message: "Đang kiểm tra file MP4..." });
  if (!fs.existsSync(output.outputPath)) {
    throw new Error("Remotion render preset xong nhưng không tạo tệp MP4.");
  }

  params.onProgress?.({ progress: 1, stage: "verifying", message: "Render preset hoàn tất." });
  return {
    ok: true,
    engine: "remotion" as const,
    presetId: input.presetId,
    fileName: output.outputFileName,
    relativePath: output.relativePath,
    videoUrl: output.videoUrl,
    durationSeconds: (endFrame - startFrame + 1) / input.fps,
    width: composition.width,
    height: composition.height,
  };
}

export function normalizePresetVideoRenderInput(raw: PresetVideoRenderBody): NormalizedPresetVideoRenderInput {
  const presetId = String(raw.presetId || "").trim();
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/i.test(presetId)) {
    throw new Error("Preset id không hợp lệ.");
  }

  const outputPreset = normalizeOutputPreset(raw.outputPreset);
  const output = OUTPUT_SIZES[outputPreset];
  const durationSeconds = clampNumber(raw.durationSeconds, 1, MAX_PRESET_DURATION_SECONDS, 10);
  const fps = clampNumber(raw.fps, 24, 60, 30);
  const trimStartSeconds = clampNumber(raw.trimStartSeconds, 0, Math.max(0, durationSeconds - 0.1), 0);
  const trimEndSeconds = clampNumber(raw.trimEndSeconds, trimStartSeconds + 0.1, durationSeconds, durationSeconds);
  const videoSources = normalizePresetVideoSources(raw.videoSources);
  const timelineVideoClips = normalizeTimelineVideoClips(raw.timelineVideoClips, durationSeconds);
  assertUniqueMediaSourceIds(videoSources, timelineVideoClips);

  return {
    presetId,
    fileName: sanitizeFileName(raw.fileName, presetId),
    outputPreset,
    ...output,
    durationSeconds,
    fps,
    trimStartSeconds,
    trimEndSeconds,
    backgroundMusicUrl: sanitizeBackgroundMusicUrl(raw.backgroundMusicUrl),
    backgroundMusicVolume: clampNumber(raw.backgroundMusicVolume, 0, 1, 0.22),
    originalAudioVolume: clampNumber(raw.originalAudioVolume, 0, 1, 1),
    lyricTimings: normalizeLyricTimings(raw.lyricTimings, durationSeconds),
    videoSources,
    timelineVideoClips,
    videoSourceStrategy: normalizePresetVideoSourceStrategy(raw.videoSourceStrategy),
  };
}

function assertUniqueMediaSourceIds(
  videoSources: readonly { id: string }[],
  timelineVideoClips: readonly { id: string }[],
) {
  const ids = new Set<string>();
  for (const source of [...videoSources, ...timelineVideoClips]) {
    if (ids.has(source.id)) throw new Error(`Video source id "${source.id}" bị trùng.`);
    ids.add(source.id);
  }
}

function normalizeTimelineVideoClips(value: unknown, durationSeconds: number) {
  if (!Array.isArray(value)) return [];

  const normalized = value.slice(0, 20).map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`Timeline video #${index + 1} không hợp lệ.`);
    }

    const candidate = raw as {
      id?: unknown;
      title?: unknown;
      watchUrl?: unknown;
      clipStartSeconds?: unknown;
      clipEndSeconds?: unknown;
      timelineStartSeconds?: unknown;
      timelineEndSeconds?: unknown;
    };
    const [source] = normalizePresetVideoSources([candidate]);
    const sourceDuration = source.clipEndSeconds - source.clipStartSeconds;
    const timelineStartSeconds = clampNumber(
      candidate.timelineStartSeconds,
      0,
      Math.max(0, durationSeconds - 0.1),
      0,
    );
    const maxTimelineEnd = Math.min(durationSeconds, timelineStartSeconds + sourceDuration);
    const timelineEndSeconds = clampNumber(
      candidate.timelineEndSeconds,
      timelineStartSeconds + 0.1,
      maxTimelineEnd,
      maxTimelineEnd,
    );

    return {
      ...source,
      title: typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim().slice(0, 120)
        : `Video ${index + 1}`,
      timelineStartSeconds,
      timelineEndSeconds,
    };
  });

  const ids = new Set<string>();
  for (const clip of normalized) {
    if (ids.has(clip.id)) throw new Error(`Timeline video id "${clip.id}" bị trùng.`);
    ids.add(clip.id);
  }
  return normalized;
}

function normalizeLyricTimings(value: unknown, durationSeconds: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, { start?: unknown; end?: unknown }>)
      .slice(0, 500)
      .filter(([id]) => /^[a-z0-9][a-z0-9-]{0,79}$/i.test(id))
      .map(([id, timing]) => {
        const start = clampNumber(timing?.start, 0, Math.max(0, durationSeconds - 0.05), 0);
        const end = clampNumber(timing?.end, start + 0.05, durationSeconds, start + 0.05);
        return [id, { start, end }];
      }),
  );
}

function normalizeOutputPreset(value: unknown): PresetVideoOutputPreset {
  return typeof value === "string" && value in OUTPUT_SIZES
    ? value as PresetVideoOutputPreset
    : "landscape-1080p";
}

function sanitizeFileName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 96) : fallback;
}

function sanitizeBackgroundMusicUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const allowedOrigin = new URL(SERVER_ORIGIN).origin;
    const resolved = new URL(trimmed, SERVER_ORIGIN);
    const isMusicLibraryAudio = /^\/api\/music-library\/[^/]+\/audio$/.test(resolved.pathname);
    if (resolved.origin !== allowedOrigin || !isMusicLibraryAudio) {
      throw new Error("Nhạc nền phải đến từ Music Library của Kai Studio.");
    }
    return resolved.toString();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Music Library")) throw error;
    throw new Error("URL nhạc nền không hợp lệ.");
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
