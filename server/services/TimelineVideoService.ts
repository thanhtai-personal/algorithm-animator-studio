import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  NormalizedTimelineVideoClip,
  NormalizedTimelineVideoProject,
  TimelineVideoAspectRatio,
  TimelineVideoFitMode,
  TimelineVideoRenderProject,
  TimelineVideoTransition,
} from "../models/TimelineVideo";
import type { RuntimeEnvValues } from "./EnvFileService";
import { createVideoOutput } from "../utils/videoOutput";
import { runFfmpeg } from "../utils/ffmpeg";

const DIMENSIONS: Record<TimelineVideoAspectRatio, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

export async function renderTimelineVideo(params: {
  project: TimelineVideoRenderProject;
  assetFiles: Record<string, Express.Multer.File>;
  envOverrides?: RuntimeEnvValues;
}) {
  const project = normalizeTimelineProject(params.project);
  const assets = params.assetFiles;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kai-video-editor-"));

  try {
    const visualClips = project.clips.filter((clip) => clip.type === "image" || clip.type === "video");
    const audioClips = project.clips.filter((clip) => clip.type === "audio");
    if (!visualClips.length) throw new Error("Timeline cần ít nhất 1 ảnh hoặc video.");

    const output = createVideoOutput(project.title, params.envOverrides);
    const segments = [] as string[];

    for (const [index, clip] of visualClips.entries()) {
      const upload = assets[clip.assetId];
      if (!upload?.path || !fs.existsSync(upload.path)) throw new Error(`Không tìm thấy file timeline: ${clip.assetId}`);
      const segmentPath = path.join(tempDir, `segment-${String(index).padStart(3, "0")}.mp4`);
      await renderVisualSegment({ clip, inputPath: upload.path, outputPath: segmentPath, project, envOverrides: params.envOverrides });
      segments.push(segmentPath);
    }

    const silentVideoPath = path.join(tempDir, "visual-timeline.mp4");
    await concatenateSegments(segments, silentVideoPath, tempDir, params.envOverrides);

    const totalDuration = visualClips.reduce((sum, clip) => sum + clip.durationSeconds, 0);
    const firstAudio = audioClips.map((clip) => assets[clip.assetId]).find((file) => file?.path && fs.existsSync(file.path));

    if (firstAudio?.path) {
      await addAudioTrack({ videoPath: silentVideoPath, audioPath: firstAudio.path, outputPath: output.outputPath, durationSeconds: totalDuration, envOverrides: params.envOverrides });
    } else {
      fs.copyFileSync(silentVideoPath, output.outputPath);
    }

    if (!fs.existsSync(output.outputPath)) throw new Error("FFmpeg chạy xong nhưng không tạo tệp MP4.");

    return {
      ok: true,
      engine: "ffmpeg-timeline" as const,
      fileName: output.outputFileName,
      relativePath: output.relativePath,
      videoUrl: output.videoUrl,
      durationSeconds: totalDuration,
      warning: buildFallbackWarning(project.clips, audioClips.length),
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function normalizeTimelineProject(raw: TimelineVideoRenderProject): NormalizedTimelineVideoProject {
  const clips = Array.isArray(raw.clips) ? raw.clips : [];
  const normalizedClips = clips
    .map((clip, index) => ({
      id: sanitizeText(clip.id, `clip-${index}`, 80),
      assetId: sanitizeText(clip.assetId, "", 120),
      type: clip.type === "audio" || clip.type === "video" ? clip.type : "image",
      durationSeconds: clampNumber(clip.durationSeconds, 1, 180, 4),
      fitMode: clip.fitMode === "contain" ? "contain" : "cover",
      transition: normalizeTransition(clip.transition),
      transitionSeconds: clampNumber(clip.transitionSeconds, 0.2, 8, 1.5),
      keepOriginalAudio: clip.keepOriginalAudio === true,
    }))
    .filter((clip): clip is NormalizedTimelineVideoClip => Boolean(clip.assetId));

  return {
    title: sanitizeText(raw.title, "timeline-video", 96),
    aspectRatio: raw.aspectRatio === "9:16" ? "9:16" : "16:9",
    fps: clampNumber(raw.fps, 24, 60, 30),
    renderEngine: raw.renderEngine === "remotion" ? "remotion" : "ffmpeg",
    clips: normalizedClips,
    showWatermark: raw.showWatermark !== false,
    watermarkText: sanitizeText(raw.watermarkText, "KAI STUDIO", 40),
    watermarkLogoAssetId: sanitizeText(raw.watermarkLogoAssetId, "", 120),
  };
}

function renderVisualSegment(params: {
  clip: NormalizedTimelineVideoClip;
  inputPath: string;
  outputPath: string;
  project: NormalizedTimelineVideoProject;
  envOverrides?: RuntimeEnvValues;
}) {
  const size = DIMENSIONS[params.project.aspectRatio];
  const duration = params.clip.durationSeconds.toFixed(3);
  const inputArgs = params.clip.type === "image"
    ? ["-loop", "1", "-framerate", String(params.project.fps), "-t", duration, "-i", params.inputPath]
    : ["-i", params.inputPath, "-t", duration];

  return runFfmpeg([
    "-y",
    ...inputArgs,
    "-an",
    "-vf",
    buildSegmentFilter({ width: size.width, height: size.height, fitMode: params.clip.fitMode, durationSeconds: params.clip.durationSeconds, transition: params.clip.transition, transitionSeconds: params.clip.transitionSeconds, fps: params.project.fps }),
    "-r",
    String(params.project.fps),
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    params.outputPath,
  ], params.envOverrides);
}

async function concatenateSegments(segments: string[], outputPath: string, tempDir: string, envOverrides?: RuntimeEnvValues) {
  const listPath = path.join(tempDir, "segments.txt");
  fs.writeFileSync(listPath, segments.map((segment) => `file '${escapeFfmpegConcatPath(segment)}'`).join("\n"), "utf8");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath], envOverrides);
}

function addAudioTrack(params: { videoPath: string; audioPath: string; outputPath: string; durationSeconds: number; envOverrides?: RuntimeEnvValues }) {
  return runFfmpeg([
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    params.audioPath,
    "-i",
    params.videoPath,
    "-t",
    params.durationSeconds.toFixed(3),
    "-map",
    "1:v:0",
    "-map",
    "0:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    params.outputPath,
  ], params.envOverrides);
}

function buildSegmentFilter(params: { width: number; height: number; fitMode: TimelineVideoFitMode; durationSeconds: number; transition: TimelineVideoTransition; transitionSeconds: number; fps: number }) {
  const filters = [buildScaleFilter(params.width, params.height, params.fitMode), `fps=${params.fps}`, "format=yuv420p"];
  if (params.transition !== "none") {
    const fade = Math.min(params.transitionSeconds, Math.max(0, params.durationSeconds / 2));
    if (fade > 0.05) {
      if (params.transition === "blurry") {
        filters.push(`boxblur=luma_radius=8:luma_power=1:enable='lt(t,${fade.toFixed(3)})+gt(t,${Math.max(0, params.durationSeconds - fade).toFixed(3)})'`);
      }
      filters.push(`fade=t=in:st=0:d=${fade.toFixed(3)}`);
      filters.push(`fade=t=out:st=${Math.max(0, params.durationSeconds - fade).toFixed(3)}:d=${fade.toFixed(3)}`);
    }
  }
  return filters.join(",");
}

function buildScaleFilter(width: number, height: number, fitMode: TimelineVideoFitMode) {
  if (fitMode === "contain") {
    return [`scale=${width}:${height}:force_original_aspect_ratio=decrease`, `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`, "setsar=1"].join(",");
  }
  return [`scale=${width}:${height}:force_original_aspect_ratio=increase`, `crop=${width}:${height}`, "setsar=1"].join(",");
}

function normalizeTransition(value: unknown): TimelineVideoTransition {
  if (
    value === "blurry" ||
    value === "fade" ||
    value === "zoom-in" ||
    value === "zoom-out" ||
    value === "slide-left" ||
    value === "slide-right" ||
    value === "slide-up" ||
    value === "slide-down" ||
    value === "push-left" ||
    value === "push-right" ||
    value === "none"
  ) return value;
  return "blurry";
}

function buildFallbackWarning(clips: NormalizedTimelineVideoClip[], audioClipCount: number) {
  const warnings: string[] = [];
  if (audioClipCount > 1) warnings.push("FFmpeg fallback hiện dùng audio đầu tiên làm nhạc/voice nền.");
  if (clips.some((clip) => clip.type === "video" && clip.keepOriginalAudio)) {
    warnings.push("Âm thanh gốc video được hỗ trợ đầy đủ khi render bằng Remotion; FFmpeg fallback vẫn tắt âm thanh gốc để tránh lẫn tiếng.");
  }
  return warnings.length ? warnings.join(" ") : undefined;
}

function sanitizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function escapeFfmpegConcatPath(filePath: string) {
  return path.resolve(filePath).replace(/\\/g, "/").replace(/'/g, "'\\''");
}
