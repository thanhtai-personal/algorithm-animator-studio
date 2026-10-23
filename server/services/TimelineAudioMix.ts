import fs from "node:fs";
import type { NormalizedTimelineVideoClip, NormalizedTimelineVideoProject } from "../models/TimelineVideo";
import type { RuntimeEnvValues } from "./EnvFileService";
import { runFfmpeg, runFfprobe } from "../utils/ffmpeg";

export type TimelineAudioSource = {
  clip: NormalizedTimelineVideoClip;
  path: string;
  offsetSeconds: number;
  durationSeconds: number;
  kind: "audio-track" | "video-original";
};

export async function muxTimelineAudio(params: {
  videoPath: string;
  outputPath: string;
  project: NormalizedTimelineVideoProject;
  assetFiles: Record<string, Express.Multer.File>;
  durationSeconds: number;
  envOverrides?: RuntimeEnvValues;
}) {
  const candidates = collectTimelineAudioSources(params.project, params.assetFiles, params.durationSeconds);
  const sources: TimelineAudioSource[] = [];
  const warnings: string[] = [];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.path)) {
      warnings.push(`Không tìm thấy audio source cho clip ${candidate.clip.assetId}.`);
      continue;
    }
    if (!(await hasAudioStream(candidate.path, params.envOverrides))) {
      warnings.push(`Media ${candidate.clip.assetId} không có audio stream nên đã bỏ qua khi mix.`);
      continue;
    }
    sources.push(candidate);
  }

  if (!sources.length) {
    fs.copyFileSync(params.videoPath, params.outputPath);
    return { sourceCount: 0, warning: warnings.length ? warnings.join(" ") : undefined };
  }

  await runFfmpeg(buildTimelineAudioMuxArgs({
    videoPath: params.videoPath,
    outputPath: params.outputPath,
    sources,
    durationSeconds: params.durationSeconds,
  }), params.envOverrides);

  if (!(await hasAudioStream(params.outputPath, params.envOverrides))) {
    throw new Error("FFmpeg đã render xong nhưng MP4 không có audio stream dù timeline có âm thanh.");
  }

  return { sourceCount: sources.length, warning: warnings.length ? warnings.join(" ") : undefined };
}

export function collectTimelineAudioSources(
  project: NormalizedTimelineVideoProject,
  assetFiles: Record<string, Express.Multer.File>,
  totalDuration: number,
) {
  const sources: TimelineAudioSource[] = [];
  let visualCursor = 0;
  let audioCursor = 0;

  for (const clip of project.clips.filter((item) => item.type !== "audio")) {
    const offsetSeconds = visualCursor;
    visualCursor += clip.durationSeconds;
    if (clip.type !== "video" || !clip.keepOriginalAudio || offsetSeconds >= totalDuration) continue;
    const file = assetFiles[clip.assetId];
    if (!file?.path) continue;
    sources.push({
      clip,
      path: file.path,
      offsetSeconds,
      durationSeconds: Math.min(clip.durationSeconds, totalDuration - offsetSeconds),
      kind: "video-original",
    });
  }

  for (const clip of project.clips.filter((item) => item.type === "audio")) {
    const offsetSeconds = audioCursor;
    audioCursor += clip.durationSeconds;
    if (clip.assetId === "silent-audio" || offsetSeconds >= totalDuration) continue;
    const file = assetFiles[clip.assetId];
    if (!file?.path) continue;
    sources.push({
      clip,
      path: file.path,
      offsetSeconds,
      durationSeconds: Math.min(clip.durationSeconds, totalDuration - offsetSeconds),
      kind: "audio-track",
    });
  }

  return sources.filter((source) => source.durationSeconds > 0.001 && source.clip.volume > 0);
}

export function buildTimelineAudioMuxArgs(params: {
  videoPath: string;
  outputPath: string;
  sources: TimelineAudioSource[];
  durationSeconds: number;
}) {
  const args = ["-y", "-i", params.videoPath];
  params.sources.forEach((source) => args.push("-i", source.path));

  const filters = params.sources.map((source, index) => {
    const inputIndex = index + 1;
    const delayMs = Math.max(0, Math.round(source.offsetSeconds * 1000));
    const duration = source.durationSeconds.toFixed(3);
    const volume = source.clip.volume.toFixed(3);
    return `[${inputIndex}:a:0]atrim=start=0:duration=${duration},asetpts=PTS-STARTPTS,volume=${volume},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${delayMs}|${delayMs}[a${index}]`;
  });
  const labels = params.sources.map((_, index) => `[a${index}]`).join("");
  filters.push(`anullsrc=r=48000:cl=stereo:d=${params.durationSeconds.toFixed(3)}[silence]`);
  filters.push(`[silence]${labels}amix=inputs=${params.sources.length + 1}:duration=longest:dropout_transition=0:normalize=0,alimiter=limit=0.98,atrim=start=0:duration=${params.durationSeconds.toFixed(3)}[timeline_audio]`);

  args.push(
    "-filter_complex", filters.join(";"),
    "-map", "0:v:0",
    "-map", "[timeline_audio]",
    "-t", params.durationSeconds.toFixed(3),
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", "48000",
    "-ac", "2",
    "-movflags", "+faststart",
    params.outputPath,
  );
  return args;
}

export async function timelineProjectHasAudio(
  project: NormalizedTimelineVideoProject,
  assetFiles: Record<string, Express.Multer.File>,
  durationSeconds: number,
  envOverrides?: RuntimeEnvValues,
) {
  const candidates = collectTimelineAudioSources(project, assetFiles, durationSeconds);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate.path) && await hasAudioStream(candidate.path, envOverrides)) return true;
  }
  return false;
}

export async function assertOutputHasAudio(outputPath: string, expected: boolean, envOverrides?: RuntimeEnvValues) {
  if (!expected) return;
  if (!(await hasAudioStream(outputPath, envOverrides))) {
    throw new Error("Video render xong nhưng bị mất audio stream. Hãy kiểm tra audio source và phiên bản FFmpeg/Remotion.");
  }
}

async function hasAudioStream(filePath: string, envOverrides?: RuntimeEnvValues) {
  try {
    const result = await runFfprobe([
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries", "stream=codec_type",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ], envOverrides);
    return result.stdout.trim() === "audio";
  } catch {
    return false;
  }
}
