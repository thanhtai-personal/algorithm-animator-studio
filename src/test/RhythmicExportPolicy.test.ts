import { afterEach, describe, expect, it, vi } from "vitest";
import {
  settleRhythmicRecordingSurface,
  startRhythmicMediaRecorder,
  usesFixedClientExportSurface,
} from "../features/rhythmic-studio/lib/rhythmicExport";

describe("rhythmic capture policy", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("repaints both export formats onto a fixed canvas so WebGL capture cannot omit unchanged frames", () => {
    expect(usesFixedClientExportSurface("mp4")).toBe(true);
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

  it("starts playback from the recorder start event instead of a fixed silent delay", async () => {
    let onStart: (() => void) | undefined;
    const requestCapturedFrame = vi.fn();
    const recorder = {
      addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
        onStart = listener as () => void;
      }),
      start: vi.fn(() => onStart?.()),
    } as unknown as MediaRecorder;

    await startRhythmicMediaRecorder(recorder, requestCapturedFrame);

    expect(recorder.addEventListener).toHaveBeenCalledWith("start", expect.any(Function), { once: true });
    expect(recorder.start).toHaveBeenCalledWith(250);
    expect(requestCapturedFrame).toHaveBeenCalledOnce();
  });

  it("does not wait for a throttled animation frame when the recorder start event is late", async () => {
    vi.useFakeTimers();
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");
    const recorder = {
      addEventListener: vi.fn(),
      start: vi.fn(),
    } as unknown as MediaRecorder;
    let started = false;
    const result = startRhythmicMediaRecorder(recorder).then(() => { started = true; });

    await vi.advanceTimersByTimeAsync(0);
    await result;

    expect(started).toBe(true);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
