import type { ColumnVisualMode } from "@/lib/animalColumns";
import type { ShortVideoType } from "@/lib/shortVideoTypes";

export type AlgorithmVideoRenderMode = "2d" | "3d" | "3d-story";

export function isAlgorithm3DRenderMode(mode: AlgorithmVideoRenderMode) {
  return mode === "3d" || mode === "3d-story";
}

export function isAlgorithm3DStoryMode(mode: AlgorithmVideoRenderMode) {
  return mode === "3d-story";
}

export function canUseAlgorithm3DVideo(params: {
  shortVideoType: ShortVideoType;
  columnVisualMode: ColumnVisualMode;
  hasWorldScene: boolean;
}) {
  return params.shortVideoType !== "kinetic-typography"
    && params.columnVisualMode !== "animal"
    && !params.hasWorldScene;
}

let cachedWebGLSupport: boolean | null = null;

export function hasWebGLVideoSupport() {
  if (cachedWebGLSupport != null) return cachedWebGLSupport;
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("webgl2", { powerPreference: "high-performance" }) || canvas.getContext("webgl");
    cachedWebGLSupport = Boolean(context);
    if (context) {
      try { context.getExtension("WEBGL_lose_context")?.loseContext(); } catch { /* best effort */ }
    }
    return cachedWebGLSupport;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}
