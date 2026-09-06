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
import { getRemotionBundleUrl } from "./RemotionRenderService";

const COMPOSITION_ID = "PresetVideo";
const OUTPUT_SIZES: Record<PresetVideoOutputPreset, { width: number; height: number; aspectRatio: PresetVideoAspectRatio }> = {
  "landscape-1080p": { width: 1920, height: 1080, aspectRatio: "16:9" },
  "landscape-720p": { width: 1280, height: 720, aspectRatio: "16:9" },
  "portrait-1080p": { width: 1080, height: 1920, aspectRatio: "9:16" },
  "portrait-720p": { width: 720, height: 1280, aspectRatio: "9:16" },
  "square-1080p": { width: 1080, height: 1080, aspectRatio: "1:1" },
};

export async function renderPresetVideo(params: {
  input: PresetVideoRenderBody;
  envOverrides?: RuntimeEnvValues;
}) {
  const input = normalizePresetVideoRenderInput(params.input);
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await getRemotionBundleUrl();
  const inputProps = {
    presetId: input.presetId,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    fps: input.fps,
    backgroundMusicUrl: input.backgroundMusicUrl,
    backgroundMusicVolume: input.backgroundMusicVolume,
    originalAudioVolume: input.originalAudioVolume,
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

  await renderMedia({
    codec: "h264",
    composition,
    serveUrl,
    inputProps,
    outputLocation: output.outputPath,
    frameRange: [startFrame, endFrame],
  });

  if (!fs.existsSync(output.outputPath)) {
    throw new Error("Remotion render preset xong nhưng không tạo tệp MP4.");
  }

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
  const durationSeconds = clampNumber(raw.durationSeconds, 1, 600, 10);
  const fps = clampNumber(raw.fps, 24, 60, 30);
  const trimStartSeconds = clampNumber(raw.trimStartSeconds, 0, Math.max(0, durationSeconds - 0.1), 0);
  const trimEndSeconds = clampNumber(raw.trimEndSeconds, trimStartSeconds + 0.1, durationSeconds, durationSeconds);

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
  };
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
