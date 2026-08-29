import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";
import { AlgorithmScene3D } from "./AlgorithmScene3D";
import type { AlgorithmVideoAdSelection } from "@/lib/algorithmVideoAds";

export type Algorithm3DExportSurface = {
  canvas: HTMLCanvasElement;
  render: (frame: Frame, previousFrame: Frame | null, frameIndex: number, progress: number) => Promise<void>;
  dispose: () => void;
};

export async function createAlgorithm3DExportSurface(params: {
  frame: Frame;
  previousFrame?: Frame | null;
  frameIndex: number;
  width: number;
  height: number;
  theme: Theme;
  ads?: AlgorithmVideoAdSelection;
  storyMode?: boolean;
}): Promise<Algorithm3DExportSurface> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.width = `${params.width}px`;
  host.style.height = `${params.height}px`;
  host.style.pointerEvents = "none";
  host.style.overflow = "hidden";
  document.body.appendChild(host);
  const root = createRoot(host);
  const canvasRef: { current: HTMLCanvasElement | null } = { current: null };

  const render = async (frame: Frame, previousFrame: Frame | null, frameIndex: number, progress: number) => {
    renderRoot(root, {
      frame, previousFrame, frameIndex,
      width: params.width, height: params.height, theme: params.theme,
      deterministicProgress: progress, canvasRef, exportMode: true, ads: params.ads, storyMode: params.storyMode,
    });
    await nextPaint();
  };

  try {
    await render(params.frame, params.previousFrame ?? null, params.frameIndex, 1);
    const canvas = await waitForCanvas(canvasRef);
    return {
      canvas,
      render,
      dispose: () => {
        root.unmount();
        host.remove();
      },
    };
  } catch (error) {
    root.unmount();
    host.remove();
    throw error;
  }
}

function renderRoot(root: Root, props: React.ComponentProps<typeof AlgorithmScene3D>) {
  flushSync(() => root.render(<AlgorithmScene3D {...props} />));
}

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function waitForCanvas(ref: { current: HTMLCanvasElement | null }) {
  for (let i = 0; i < 12; i += 1) {
    if (ref.current) return ref.current;
    await nextPaint();
  }
  throw new Error("WebGL 3D export canvas could not be initialized.");
}
