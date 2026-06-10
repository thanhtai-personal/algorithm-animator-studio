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
      warning: audioClips.length > 1 ? "MVP hiện dùng audio đầu tiên làm nhạc/voice nền; audio còn lại để dành cho bản mixer nâng cao." : undefined,
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
    }))
    .filter((clip): clip is NormalizedTimelineVideoClip => Boolean(clip.assetId));

  return {
    title: sanitizeText(raw.title, "timeline-video", 96),
    aspectRatio: raw.aspectRatio === "9:16" ? "9:16" : "16:9",
    fps: clampNumber(raw.fps, 24, 60, 30),
    renderEngine: raw.renderEngine === "remotion" ? "remotion" : "ffmpeg",
    clips: normalizedClips,
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
    buildSegmentFilter({ width: size.width, height: size.height, fitMode: params.clip.fitMode, durationSeconds: params.clip.durationSeconds, transition: params.clip.transition, fps: params.project.fps }),
    "-r",
    String(params.project.fps),
    "-c:v",
    "libx264",
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

function buildSegmentFilter(params: { width: number; height: number; fitMode: TimelineVideoFitMode; durationSeconds: number; transition: TimelineVideoTransition; fps: number }) {
  const filters = [buildScaleFilter(params.width, params.height, params.fitMode), `fps=${params.fps}`, "format=yuv420p"];
  if (params.transition === "fade" || params.transition === "zoom") {
    const fade = Math.min(0.45, Math.max(0, params.durationSeconds / 3));
    if (fade > 0.05) {
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
  if (value === "fade" || value === "zoom") return value;
  return "none";
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
