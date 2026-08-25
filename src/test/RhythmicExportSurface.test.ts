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
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
      fillRect,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(42);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const source = document.createElement("canvas");

    const surface = createFixedRhythmicExportSurface(source, preset);

    expect(surface.canvas.width).toBe(width);
    expect(surface.canvas.height).toBe(height);
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, width, height);
    surface.stop();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
  });
});
