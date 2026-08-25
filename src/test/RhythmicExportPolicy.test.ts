import { afterEach, describe, expect, it, vi } from "vitest";
import {
  settleRhythmicRecordingSurface,
  usesFixedClientExportSurface,
} from "../features/rhythmic-studio/lib/rhythmicExport";

describe("rhythmic capture policy", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("captures MP4 directly from WebGL and leaves final sizing to FFmpeg", () => {
    expect(usesFixedClientExportSurface("mp4")).toBe(false);
    expect(usesFixedClientExportSurface("webm")).toBe(true);
  });

  it("settles two painted frames before MediaRecorder starts", async () => {
    vi.useFakeTimers();
    const requestFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => (
      window.setTimeout(() => callback(performance.now()), 16)
    ));
    let settled = false;
    const result = settleRhythmicRecordingSurface().then(() => { settled = true; });

    await vi.advanceTimersByTimeAsync(191);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await result;

    expect(requestFrame).toHaveBeenCalledTimes(2);
    expect(settled).toBe(true);
  });
});
