import fs from "node:fs";
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
  if (!fs.existsSync(params.audioPath)) {
    throw new Error("Không tìm thấy tệp audio để tạo video.");
  }

  if (!fs.existsSync(params.imagePath)) {
    throw new Error("Không tìm thấy tệp nền để tạo video.");
  }

  if (params.options.backgroundMusicPath && !fs.existsSync(params.options.backgroundMusicPath)) {
    throw new Error("Không tìm thấy tệp nhạc nền đã chọn.");
  }

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

  if (!fs.existsSync(output.outputPath)) {
    throw new Error("FFmpeg chạy xong nhưng không tạo tệp video.");
  }

  return {
    ok: true,
    durationSeconds,
    fileName: output.outputFileName,
    relativePath: output.relativePath,
    videoUrl: output.videoUrl,
    ffmpegWarning: ffmpegResult.stderr || "",
  };
}

export function normalizeVideoAspectRatio(value: unknown): VideoAspectRatio {
  return value === "9:16" ? "9:16" : "16:9";
}

export function normalizeVideoBackgroundType(value: unknown): VideoBackgroundType {
  if (value === "gif" || value === "video") {
    return value;
  }

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
      "-y",
      ...getBackgroundInputArgs(params.backgroundType, params.backgroundPath),
      "-i",
      params.audioPath,
      "-t",
      duration,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-tune",
      "stillimage",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-shortest",
      params.outputPath,
    ];
  }

  return [
    "-y",
    ...getBackgroundInputArgs(params.backgroundType, params.backgroundPath),
    "-i",
    params.audioPath,
    ...getBackgroundMusicInputArgs(params.backgroundMusicLoop, params.backgroundMusicPath),
    "-t",
    duration,
    "-map",
    "0:v:0",
    "-vf",
    videoFilter,
    "-filter_complex",
    buildAudioMixFilter({
      durationSeconds: params.durationSeconds,
      fadeIn: params.backgroundMusicFadeIn,
      fadeOut: params.backgroundMusicFadeOut,
      musicVolume: params.backgroundMusicVolume,
    }),
    "-map",
    "[mixed_audio]",
    "-c:v",
    "libx264",
    "-tune",
    "stillimage",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-shortest",
    params.outputPath,
  ];
}

function getBackgroundInputArgs(backgroundType: VideoBackgroundType, backgroundPath: string) {
  if (backgroundType === "image") {
    return ["-loop", "1", "-framerate", "30", "-i", backgroundPath];
  }

  return ["-stream_loop", "-1", "-i", backgroundPath];
}

function getBackgroundMusicInputArgs(loop: boolean, musicPath: string) {
  return loop ? ["-stream_loop", "-1", "-i", musicPath] : ["-i", musicPath];
}

function buildAudioMixFilter(params: {
  durationSeconds: number;
  fadeIn: number;
  fadeOut: number;
  musicVolume: number;
}) {
  const fadeOutDuration = Math.min(params.fadeOut, Math.max(0, params.durationSeconds));
  const fadeOutStart = Math.max(0, params.durationSeconds - fadeOutDuration);
  const filters = [
    `[2:a]volume=${params.musicVolume.toFixed(3)}`,
  ];

  if (params.fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${params.fadeIn.toFixed(3)}`);
  }

  if (fadeOutDuration > 0) {
    filters.push(`afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOutDuration.toFixed(3)}`);
  }

  return [
    `${filters.join(",")}[bgm]`,
    "[1:a][bgm]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[mixed_audio]",
  ].join(";");
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
