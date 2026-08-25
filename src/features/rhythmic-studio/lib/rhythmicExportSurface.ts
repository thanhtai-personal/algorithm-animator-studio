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
    startCapture: (_fps: number, _requestFrame: () => void) => undefined,
    stop: () => undefined,
  };
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  let stopped = false;
  let timer = 0;
  const paint = () => {
    if (stopped) return;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(source, 0, 0, size.width, size.height);
  };
  paint();

  return {
    canvas: output,
    manualFrames: true,
    startCapture: (fps: number, requestFrame: () => void) => {
      paint();
      requestFrame();
      timer = window.setInterval(() => {
        paint();
        requestFrame();
      }, 1000 / Math.max(1, fps));
    },
    stop: () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
    },
  };
}
