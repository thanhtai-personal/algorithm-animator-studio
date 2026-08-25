import { describe, expect, it } from "vitest";
import {
  analyzeRhythmicCaptureCadence,
  buildRhythmicCaptureProbeArgs,
  buildRhythmicMp4TranscodeArgs,
  parseRhythmicCaptureProbe,
} from "../../server/utils/rhythmicTranscode";

describe("rhythmic MP4 transcode", () => {
  it("normalizes irregular browser timestamps to fixed 60 fps and exact portrait size", () => {
    const args = buildRhythmicMp4TranscodeArgs("capture.webm", "result.mp4", {
      fps: 60,
      width: 720,
      height: 1280,
    }, {
      frameCount: 3_580,
      durationSeconds: 60,
    });
    const filter = args[args.indexOf("-vf") + 1];

    expect(filter).toContain("fps=60");
    expect(filter).toContain("setpts=N*60.000000/(3579*TB)");
    expect(filter).toContain("scale=720:1280:force_original_aspect_ratio=decrease");
    expect(filter).toContain("pad=720:1280");
    expect(args).toContain("cfr");
    expect(args).toContain("aresample=async=1:first_pts=0");
  });

  it("falls back to safe values for untrusted multipart fields", () => {
    const args = buildRhythmicMp4TranscodeArgs("capture.webm", "result.mp4", {
      fps: "999",
      width: "bad",
      height: "0",
    });
    const filter = args[args.indexOf("-vf") + 1];

    expect(filter).toContain("fps=60");
    expect(filter).toContain("scale=720:1280");
  });

  it("rejects the severely undersampled cadence measured in the reported export", () => {
    const cadence = analyzeRhythmicCaptureCadence({
      frameCount: 1967,
      durationSeconds: 94.419,
      targetFps: 60,
      maxFrameGapMs: 780,
    });

    expect(cadence.capturedFps).toBeCloseTo(20.83, 2);
    expect(cadence.ratio).toBeCloseTo(0.347, 3);
    expect(cadence.healthy).toBe(false);
  });

  it("accepts a capture near the requested cadence without long frozen gaps", () => {
    expect(analyzeRhythmicCaptureCadence({
      frameCount: 3400,
      durationSeconds: 60,
      targetFps: 60,
      maxFrameGapMs: 42,
    }).healthy).toBe(true);
  });

  it("accepts an isolated browser timestamp gap when almost every target frame is present", () => {
    expect(analyzeRhythmicCaptureCadence({
      frameCount: 168,
      durationSeconds: 5.666,
      targetFps: 30,
      maxFrameGapMs: 200,
    }).healthy).toBe(true);
  });

  it("rejects a long frozen gap even when average frame cadence is high", () => {
    expect(analyzeRhythmicCaptureCadence({
      frameCount: 3540,
      durationSeconds: 60,
      targetFps: 60,
      maxFrameGapMs: 420,
    }).healthy).toBe(false);
  });

  it("parses frame timestamps and builds a full cadence probe", () => {
    const args = buildRhythmicCaptureProbeArgs("capture.webm");
    const cadence = parseRhythmicCaptureProbe(JSON.stringify({
      frames: [
        { best_effort_timestamp_time: "0.000" },
        { best_effort_timestamp_time: "0.016" },
        { best_effort_timestamp_time: "0.050" },
      ],
      streams: [{ nb_read_frames: "3", duration: "0.067" }],
      format: { duration: "0.067" },
    }), 60);

    expect(args).toContain("-count_frames");
    expect(args.join(" ")).toContain("frame=best_effort_timestamp_time");
    expect(cadence?.frameCount).toBe(3);
    expect(cadence?.maxFrameGapMs).toBeCloseTo(34, 1);
  });
});
