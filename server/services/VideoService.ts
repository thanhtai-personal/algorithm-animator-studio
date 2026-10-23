import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  VideoAspectRatio,
  VideoBackgroundType,
  VideoFitMode,
  VideoGenerationOptions,
} from "../models/Video";
import { getAudioDurationSeconds, runFfmpeg } from "../utils/ffmpeg";
import type { RuntimeEnvValues } from "./EnvFileService";
import { createVideoOutput } from "../utils/videoOutput";

const VIDEO_DIMENSIONS: Record<VideoAspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

export async function generateVideoFromAudio(params: {
  audioPath: string;
  imagePath: string;
  options: VideoGenerationOptions;
  envOverrides?: RuntimeEnvValues;
}) {
  assertFileExists(params.audioPath, "Không tìm thấy tệp audio để tạo video.");
  assertFileExists(params.imagePath, "Không tìm thấy tệp nền để tạo video.");
  if (params.options.backgroundMusicPath) assertFileExists(params.options.backgroundMusicPath, "Không tìm thấy tệp nhạc nền đã chọn.");

  const output = createVideoOutput(params.options.videoFileName, params.envOverrides);
  const durationSeconds = await getAudioDurationSeconds(params.audioPath, params.envOverrides);
  const ffmpegResult = await runFfmpeg(
    buildFfmpegArgs({
      audioPath: params.audioPath,
      backgroundMusicFadeIn: params.options.backgroundMusicFadeIn,
      backgroundMusicFadeOut: params.options.backgroundMusicFadeOut,
      backgroundMusicLoop: params.options.backgroundMusicLoop,
      backgroundMusicPath: params.options.backgroundMusicPath,
      backgroundMusicVolume: params.options.backgroundMusicVolume,
      backgroundType: params.options.backgroundType,
      durationSeconds,
      backgroundPath: params.imagePath,
      outputPath: output.outputPath,
      aspectRatio: params.options.aspectRatio,
      fitMode: params.options.fitMode,
    }),
    params.envOverrides
  );

  if (!fs.existsSync(output.outputPath)) throw new Error("FFmpeg chạy xong nhưng không tạo tệp video.");

  return {
    ok: true,
    durationSeconds,
    fileName: output.outputFileName,
    relativePath: output.relativePath,
    videoUrl: output.videoUrl,
    ffmpegWarning: ffmpegResult.stderr || "",
  };
}

export async function generateSlideshowVideoFromAudioTimeline(params: {
  audioPaths: string[];
  backgrounds: { path: string; durationSeconds: number }[];
  options: Omit<VideoGenerationOptions, "backgroundType">;
  envOverrides?: RuntimeEnvValues;
}) {
  const audioPaths = params.audioPaths.filter(Boolean);
  if (!audioPaths.length) throw new Error("Chưa chọn file voice để tạo video.");
  if (!params.backgrounds.length) throw new Error("Chưa chọn ảnh nền video.");

  audioPaths.forEach((audioPath) => assertFileExists(audioPath, "Không tìm thấy file voice đã chọn."));
  params.backgrounds.forEach((background) => assertFileExists(background.path, "Không tìm thấy ảnh nền đã chọn."));
  if (params.options.backgroundMusicPath) assertFileExists(params.options.backgroundMusicPath, "Không tìm thấy tệp nhạc nền đã chọn.");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kata-mu-news-video-"));
  let narrationPath = audioPaths[0];

  try {
    if (audioPaths.length > 1) {
      narrationPath = path.join(tempDir, "combined-narration.wav");
      await concatenateAudioFiles(audioPaths, narrationPath, tempDir, params.envOverrides);
    }

    const output = createVideoOutput(params.options.videoFileName, params.envOverrides);
    const durationSeconds = await getAudioDurationSeconds(narrationPath, params.envOverrides);
    const backgrounds = normalizeTimelineBackgrounds(params.backgrounds, durationSeconds);
    const ffmpegResult = await runFfmpeg(
      buildSlideshowFfmpegArgs({
        audioPath: narrationPath,
        backgrounds,
        durationSeconds,
        outputPath: output.outputPath,
        aspectRatio: params.options.aspectRatio,
        fitMode: params.options.fitMode,
        backgroundMusicPath: params.options.backgroundMusicPath,
        backgroundMusicVolume: params.options.backgroundMusicVolume,
        backgroundMusicLoop: params.options.backgroundMusicLoop,
        backgroundMusicFadeIn: params.options.backgroundMusicFadeIn,
        backgroundMusicFadeOut: params.options.backgroundMusicFadeOut,
      }),
      params.envOverrides
    );

    if (!fs.existsSync(output.outputPath)) throw new Error("FFmpeg chạy xong nhưng không tạo tệp video.");

    return {
      ok: true,
      durationSeconds,
      fileName: output.outputFileName,
      relativePath: output.relativePath,
      videoUrl: output.videoUrl,
      ffmpegWarning: ffmpegResult.stderr || "",
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export function normalizeVideoAspectRatio(value: unknown): VideoAspectRatio {
  return value === "9:16" ? "9:16" : "16:9";
}

export function normalizeVideoBackgroundType(value: unknown): VideoBackgroundType {
  if (value === "gif" || value === "video") return value;
  return "image";
}

export function normalizeVideoFitMode(value: unknown): VideoFitMode {
  return value === "contain" ? "contain" : "cover";
}

function buildFfmpegArgs(params: {
  audioPath: string;
  backgroundPath: string;
  backgroundType: VideoBackgroundType;
  durationSeconds: number;
  outputPath: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  backgroundMusicPath?: string;
  backgroundMusicVolume: number;
  backgroundMusicLoop: boolean;
  backgroundMusicFadeIn: number;
  backgroundMusicFadeOut: number;
}) {
  const dimensions = VIDEO_DIMENSIONS[params.aspectRatio];
  const videoFilter = buildVideoFilter(dimensions.width, dimensions.height, params.fitMode);
  const duration = String(Math.ceil(params.durationSeconds * 1000) / 1000);

  if (!params.backgroundMusicPath) {
    return [
      "-y", ...getBackgroundInputArgs(params.backgroundType, params.backgroundPath), "-i", params.audioPath,
      "-t", duration, "-map", "0:v:0", "-map", "1:a:0", "-vf", videoFilter,
      "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-shortest", params.outputPath,
    ];
  }

  return [
    "-y", ...getBackgroundInputArgs(params.backgroundType, params.backgroundPath), "-i", params.audioPath,
    ...getBackgroundMusicInputArgs(params.backgroundMusicLoop, params.backgroundMusicPath),
    "-t", duration, "-map", "0:v:0", "-vf", videoFilter,
    "-filter_complex", buildAudioMixFilter({ audioIndex: 1, musicIndex: 2, durationSeconds: params.durationSeconds, fadeIn: params.backgroundMusicFadeIn, fadeOut: params.backgroundMusicFadeOut, musicVolume: params.backgroundMusicVolume }),
    "-map", "[mixed_audio]", "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-shortest", params.outputPath,
  ];
}

function buildSlideshowFfmpegArgs(params: {
  audioPath: string;
  backgrounds: { path: string; durationSeconds: number }[];
  durationSeconds: number;
  outputPath: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  backgroundMusicPath?: string;
  backgroundMusicVolume: number;
  backgroundMusicLoop: boolean;
  backgroundMusicFadeIn: number;
  backgroundMusicFadeOut: number;
}) {
  const dimensions = VIDEO_DIMENSIONS[params.aspectRatio];
  const duration = String(Math.ceil(params.durationSeconds * 1000) / 1000);
  const backgroundInputs = params.backgrounds.flatMap((background) => [
    "-loop", "1", "-framerate", "30", "-t", background.durationSeconds.toFixed(3), "-i", background.path,
  ]);
  const audioIndex = params.backgrounds.length;
  const musicIndex = params.backgrounds.length + 1;
  const commonOutput = [
    "-c:v", "libx264", "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-shortest", params.outputPath,
  ];

  if (!params.backgroundMusicPath) {
    return [
      "-y", ...backgroundInputs, "-i", params.audioPath, "-t", duration,
      "-filter_complex", buildSlideshowVideoFilter(params.backgrounds.length, dimensions.width, dimensions.height, params.fitMode),
      "-map", "[vout]", "-map", `${audioIndex}:a:0`, ...commonOutput,
    ];
  }

  return [
    "-y", ...backgroundInputs, "-i", params.audioPath, ...getBackgroundMusicInputArgs(params.backgroundMusicLoop, params.backgroundMusicPath), "-t", duration,
    "-filter_complex", [
      buildSlideshowVideoFilter(params.backgrounds.length, dimensions.width, dimensions.height, params.fitMode),
      buildAudioMixFilter({ audioIndex, musicIndex, durationSeconds: params.durationSeconds, fadeIn: params.backgroundMusicFadeIn, fadeOut: params.backgroundMusicFadeOut, musicVolume: params.backgroundMusicVolume }),
    ].join(";"),
    "-map", "[vout]", "-map", "[mixed_audio]", ...commonOutput,
  ];
}

async function concatenateAudioFiles(audioPaths: string[], outputPath: string, tempDir: string, envOverrides?: RuntimeEnvValues) {
  const listPath = path.join(tempDir, "audio-list.txt");
  fs.writeFileSync(listPath, audioPaths.map((audioPath) => `file '${escapeFfmpegConcatPath(audioPath)}'`).join("\n"), "utf8");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "pcm_s16le", outputPath], envOverrides);
}

function normalizeTimelineBackgrounds(backgrounds: { path: string; durationSeconds: number }[], audioDuration: number) {
  const normalized = backgrounds.map((item) => ({ path: item.path, durationSeconds: clampNumber(item.durationSeconds, 1, 120) }));
  const total = normalized.reduce((sum, item) => sum + item.durationSeconds, 0);
  if (normalized.length && total < audioDuration) normalized[normalized.length - 1].durationSeconds += audioDuration - total;
  return normalized;
}

function getBackgroundInputArgs(backgroundType: VideoBackgroundType, backgroundPath: string) {
  if (backgroundType === "image") return ["-loop", "1", "-framerate", "30", "-i", backgroundPath];
  return ["-stream_loop", "-1", "-i", backgroundPath];
}

function getBackgroundMusicInputArgs(loop: boolean, musicPath: string) {
  return loop ? ["-stream_loop", "-1", "-i", musicPath] : ["-i", musicPath];
}

function buildAudioMixFilter(params: {
  audioIndex: number;
  musicIndex: number;
  durationSeconds: number;
  fadeIn: number;
  fadeOut: number;
  musicVolume: number;
}) {
  const fadeOutDuration = Math.min(params.fadeOut, Math.max(0, params.durationSeconds));
  const fadeOutStart = Math.max(0, params.durationSeconds - fadeOutDuration);
  const filters = [`[${params.musicIndex}:a]volume=${params.musicVolume.toFixed(3)}`];
  if (params.fadeIn > 0) filters.push(`afade=t=in:st=0:d=${params.fadeIn.toFixed(3)}`);
  if (fadeOutDuration > 0) filters.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOutDuration.toFixed(3)}`);
  return [
    `${filters.join(",")}[bgm]`,
    `[${params.audioIndex}:a][bgm]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[mixed_audio]`,
  ].join(";");
}

function buildSlideshowVideoFilter(count: number, width: number, height: number, fitMode: VideoFitMode) {
  const videoFilter = buildVideoFilter(width, height, fitMode);
  const transforms = Array.from({ length: count }, (_, index) => `[${index}:v]${videoFilter},fps=30,format=yuv420p[v${index}]`);
  const concatInputs = Array.from({ length: count }, (_, index) => `[v${index}]`).join("");
  return [...transforms, `${concatInputs}concat=n=${count}:v=1:a=0[vout]`].join(";");
}

function buildVideoFilter(width: number, height: number, fitMode: VideoFitMode) {
  if (fitMode === "contain") {
    return [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
      "setsar=1",
    ].join(",");
  }

  return [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
    "setsar=1",
  ].join(",");
}

function assertFileExists(filePath: string, message: string) {
  if (!fs.existsSync(filePath)) throw new Error(message);
}

function clampNumber(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function escapeFfmpegConcatPath(filePath: string) {
  return path.resolve(filePath).replace(/\\/g, "/").replace(/'/g, "'\\''");
}
