import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixedRhythmicExportSurface } from "../features/rhythmic-studio/lib/rhythmicExportSurface";
import { prepareRhythmicExportFrame } from "../features/rhythmic-studio/lib/rhythmicExport";

describe("fixed rhythmic export surface", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["portrait-720p", 720, 1280],
    ["landscape-720p", 1280, 720],
  ] as const)("creates a native %s recording canvas", (preset, width, height) => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      fillRect,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);
    let scheduled: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      scheduled = callback;
      return 42;
    });
    const cancelAnimationFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    let afterRender: (() => void) | undefined;
    const setTimeout = vi.spyOn(window, "setTimeout").mockImplementation((callback) => {
      afterRender = callback as () => void;
      return 73;
    });
    const clearTimeout = vi.spyOn(window, "clearTimeout").mockImplementation(() => undefined);
    const source = document.createElement("canvas");

    const surface = createFixedRhythmicExportSurface(source, preset);

    expect(surface.canvas.width).toBe(width);
    expect(surface.canvas.height).toBe(height);
    expect(surface.manualFrames).toBe(false);
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, width, height);
    const now = performance.now();
    surface.startCapture(30);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    scheduled?.(now + 1000 / 30);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    expect(drawImage).toHaveBeenCalledTimes(2);
    afterRender?.();
    expect(drawImage).toHaveBeenCalledTimes(3);
    surface.stop();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(clearTimeout).toHaveBeenCalledWith(73);
  });

  it("pauses and seeks the scene before MediaRecorder can capture the old preview frame", () => {
    const calls: string[] = [];
    const store = {
      setPlaying: (playing: boolean) => calls.push(`playing:${playing}`),
      setTimeMs: (timeMs: number) => calls.push(`time:${timeMs}`),
    };

    prepareRhythmicExportFrame(store, 4_200);

    expect(calls).toEqual(["playing:false", "time:4200"]);
  });
});
