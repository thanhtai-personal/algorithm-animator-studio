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
  if (!context) return { canvas: source, stop: () => undefined };
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  let stopped = false;
  let raf = 0;
  const paint = () => {
    if (stopped) return;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(source, 0, 0, size.width, size.height);
    raf = window.requestAnimationFrame(paint);
  };
  paint();

  return {
    canvas: output,
    stop: () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
    },
  };
}
