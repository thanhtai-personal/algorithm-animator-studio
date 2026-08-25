export interface RhythmicTranscodeFields {
  fps?: unknown;
  width?: unknown;
  height?: unknown;
}

export interface RhythmicCaptureCadenceInput {
  frameCount: number;
  durationSeconds: number;
  targetFps: number;
  maxFrameGapMs?: number;
}

export interface RhythmicCaptureCadence extends Required<RhythmicCaptureCadenceInput> {
  capturedFps: number;
  ratio: number;
  healthy: boolean;
}

const MINIMUM_CAPTURE_CADENCE_RATIO = 0.82;
const MAXIMUM_VISIBLE_FREEZE_MS = 120;

function numericField(value: unknown) {
  const normalized = Array.isArray(value) ? value[0] : value;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : Number.NaN;
}

export function normalizeRhythmicTranscodeFields(fields: RhythmicTranscodeFields) {
  const requestedFps = numericField(fields.fps);
  const fps = requestedFps === 30 || requestedFps === 60 || requestedFps === 120
    ? requestedFps
    : 60;
  const requestedWidth = numericField(fields.width);
  const requestedHeight = numericField(fields.height);
  const landscape = requestedWidth === 1280 && requestedHeight === 720;
  return {
    fps,
    width: landscape ? 1280 : 720,
    height: landscape ? 720 : 1280,
  };
}

export function analyzeRhythmicCaptureCadence({
  frameCount,
  durationSeconds,
  targetFps,
  maxFrameGapMs = 0,
}: RhythmicCaptureCadenceInput): RhythmicCaptureCadence {
  const capturedFps = durationSeconds > 0 ? frameCount / durationSeconds : 0;
  const ratio = targetFps > 0 ? capturedFps / targetFps : 0;
  const maximumAllowedGapMs = Math.max(MAXIMUM_VISIBLE_FREEZE_MS, 4000 / targetFps);
  const valid = frameCount >= 2
    && Number.isFinite(durationSeconds)
    && durationSeconds > 0
    && Number.isFinite(maxFrameGapMs)
    && maxFrameGapMs >= 0;

  return {
    frameCount,
    durationSeconds,
    targetFps,
    maxFrameGapMs,
    capturedFps,
    ratio,
    healthy: valid
      && ratio >= MINIMUM_CAPTURE_CADENCE_RATIO
      && maxFrameGapMs <= maximumAllowedGapMs,
  };
}

export function buildRhythmicCaptureProbeArgs(inputPath: string) {
  return [
    "-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_frames",
    "-show_entries", "frame=best_effort_timestamp_time:stream=nb_read_frames,duration:format=duration",
    "-of", "json", inputPath,
  ];
}

export function parseRhythmicCaptureProbe(
  output: string,
  targetFps: number,
): RhythmicCaptureCadence | null {
  try {
    const probe = JSON.parse(output) as {
      frames?: Array<{ best_effort_timestamp_time?: unknown }>;
      streams?: Array<{ nb_read_frames?: unknown; duration?: unknown }>;
      format?: { duration?: unknown };
    };
    const timestamps = (probe.frames || [])
      .map((frame) => Number(frame.best_effort_timestamp_time))
      .filter((value) => Number.isFinite(value));
    const countedFrames = Number(probe.streams?.[0]?.nb_read_frames);
    const frameCount = Number.isFinite(countedFrames) && countedFrames > 0
      ? countedFrames
      : timestamps.length;
    const streamDuration = Number(probe.streams?.[0]?.duration);
    const formatDuration = Number(probe.format?.duration);
    const timestampDuration = timestamps.length > 1
      ? timestamps[timestamps.length - 1] - timestamps[0]
      : 0;
    const durationSeconds = [streamDuration, formatDuration, timestampDuration]
      .find((value) => Number.isFinite(value) && value > 0) || 0;
    let maxFrameGapMs = 0;
    for (let index = 1; index < timestamps.length; index += 1) {
      maxFrameGapMs = Math.max(maxFrameGapMs, (timestamps[index] - timestamps[index - 1]) * 1000);
    }

    if (frameCount < 2 || durationSeconds <= 0) return null;
    return analyzeRhythmicCaptureCadence({ frameCount, durationSeconds, targetFps, maxFrameGapMs });
  } catch {
    return null;
  }
}

export function buildRhythmicMp4TranscodeArgs(
  inputPath: string,
  outputPath: string,
  fields: RhythmicTranscodeFields,
) {
  const { fps, width, height } = normalizeRhythmicTranscodeFields(fields);
  const videoFilter = [
    `fps=${fps}`,
    `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
    "setsar=1",
  ].join(",");

  return [
    "-y", "-fflags", "+genpts", "-i", inputPath,
    "-map", "0:v:0", "-map", "0:a:0?",
    "-vf", videoFilter,
    "-vsync", "cfr", "-r", String(fps),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-af", "aresample=async=1:first_pts=0",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outputPath,
  ];
}
