import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixedRhythmicExportSurface } from "../features/rhythmic-studio/lib/rhythmicExportSurface";

describe("fixed rhythmic export surface", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["portrait-720p", 720, 1280],
    ["landscape-720p", 1280, 720],
  ] as const)("creates a native %s recording canvas", (preset, width, height) => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const requestFrame = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      fillRect,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);
    const setInterval = vi.spyOn(window, "setInterval").mockReturnValue(42);
    const clearInterval = vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);
    const source = document.createElement("canvas");

    const surface = createFixedRhythmicExportSurface(source, preset);

    expect(surface.canvas.width).toBe(width);
    expect(surface.canvas.height).toBe(height);
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, width, height);
    surface.startCapture(30, requestFrame);
    expect(requestFrame).toHaveBeenCalledOnce();
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000 / 30);
    surface.stop();
    expect(clearInterval).toHaveBeenCalledWith(42);
  });
});
