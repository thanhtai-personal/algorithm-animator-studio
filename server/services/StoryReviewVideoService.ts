import fs from "node:fs";
import type { VideoAspectRatio, VideoFitMode } from "../models/Video";
import { createVideoOutput } from "../utils/videoOutput";
import { runFfmpeg } from "../utils/ffmpeg";
import type { RuntimeEnvValues } from "./EnvFileService";

const VIDEO_DIMENSIONS: Record<VideoAspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

export type StoryReviewSceneInput = {
  path: string;
  mimeType: string;
  durationSeconds: number;
};

export async function mergeStoryReviewScenes(params: {
  scenes: StoryReviewSceneInput[];
  audioPath?: string;
  videoFileName?: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
  envOverrides?: RuntimeEnvValues;
}) {
  if (!params.scenes.length) throw new Error("Chưa có phân cảnh để ghép video.");
  params.scenes.forEach((scene) => {
    if (!fs.existsSync(scene.path)) throw new Error("Không tìm thấy file phân cảnh.");
  });
  if (params.audioPath && !fs.existsSync(params.audioPath)) throw new Error("Không tìm thấy file audio lời thoại.");

  const output = createVideoOutput(params.videoFileName || "review-truyen", params.envOverrides);
  const durationSeconds = params.scenes.reduce((sum, scene) => sum + clampDuration(scene.durationSeconds), 0);
  const ffmpegResult = await runFfmpeg(
    buildReviewMergeArgs({
      scenes: params.scenes,
      audioPath: params.audioPath,
      outputPath: output.outputPath,
      aspectRatio: params.aspectRatio,
      fitMode: params.fitMode,
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

function buildReviewMergeArgs(params: {
  scenes: StoryReviewSceneInput[];
  audioPath?: string;
  outputPath: string;
  aspectRatio: VideoAspectRatio;
  fitMode: VideoFitMode;
}) {
  const dimensions = VIDEO_DIMENSIONS[params.aspectRatio];
  const sceneInputs = params.scenes.flatMap((scene) => {
    const duration = clampDuration(scene.durationSeconds).toFixed(3);
    if (scene.mimeType.startsWith("video/")) return ["-stream_loop", "-1", "-t", duration, "-i", scene.path];
    return ["-loop", "1", "-framerate", "30", "-t", duration, "-i", scene.path];
  });
  const audioInput = params.audioPath ? ["-i", params.audioPath] : [];
  const outputArgs = params.audioPath
    ? ["-map", "[vout]", "-map", `${params.scenes.length}:a:0`, "-shortest"]
    : ["-map", "[vout]"];

  return [
    "-y",
    ...sceneInputs,
    ...audioInput,
    "-filter_complex",
    buildTimelineFilter(params.scenes.length, dimensions.width, dimensions.height, params.fitMode),
    ...outputArgs,
    "-c:v", "libx264",
    "-c:a", "aac",
    "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    params.outputPath,
  ];
}

function buildTimelineFilter(count: number, width: number, height: number, fitMode: VideoFitMode) {
  const videoFilter = buildVideoFilter(width, height, fitMode);
  const transforms = Array.from({ length: count }, (_, index) => (
    `[${index}:v]${videoFilter},fps=30,format=yuv420p,setpts=PTS-STARTPTS[v${index}]`
  ));
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

function clampDuration(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 6;
  return Math.min(120, Math.max(1, parsed));
}
