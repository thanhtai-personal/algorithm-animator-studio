import type { RhythmicOutputPreset } from "../types";
import { rhythmicOutputSize } from "./outputSize";

export function createFixedRhythmicExportSurface(
  source: HTMLCanvasElement,
  outputPreset: RhythmicOutputPreset,
) {
  const size = rhythmicOutputSize(outputPreset);
  const output = document.createElement("canvas");
  output.width = size.width;
  output.height = size.height;
  const context = output.getContext("2d", { alpha: false });
  if (!context) return {
    canvas: source,
    manualFrames: false,
    startCapture: (_fps: number) => undefined,
    stop: () => undefined,
  };
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  let stopped = false;
  let frame = 0;
  let afterRenderTimer = 0;
  const paint = () => {
    if (stopped) return;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(source, 0, 0, size.width, size.height);
  };
  paint();

  return {
    canvas: output,
    manualFrames: false,
    startCapture: (fps: number) => {
      paint();
      const intervalMs = 1000 / Math.max(1, fps);
      let lastPaintAt = performance.now();
      const captureNextFrame = (now: number) => {
        if (stopped) return;
        if (now - lastPaintAt >= intervalMs - 0.5) {
          lastPaintAt = now;
          if (afterRenderTimer) window.clearTimeout(afterRenderTimer);
          // R3F and this copier both run from requestAnimationFrame. Defer the
          // copy to the following task so the WebGL renderer has committed the
          // current marble position before captureStream observes the 2D canvas.
          afterRenderTimer = window.setTimeout(paint, 0);
        }
        frame = window.requestAnimationFrame(captureNextFrame);
      };
      frame = window.requestAnimationFrame(captureNextFrame);
    },
    stop: () => {
      stopped = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (afterRenderTimer) window.clearTimeout(afterRenderTimer);
    },
  };
}
