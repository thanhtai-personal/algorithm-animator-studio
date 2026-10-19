import sourceManifest from "../../../docs/video-references/math-sincos-v1.scene-manifest.json";

/**
 * Source-audited coarse timings from the MP4. The source of truth is the
 * versioned reference manifest; shot-level cues remain candidates for Task 05.
 */
export const MATH_FPS = sourceManifest.source.fps;
export const MATH_WIDTH = sourceManifest.source.width;
export const MATH_HEIGHT = sourceManifest.source.height;
export const MATH_FRAMES = sourceManifest.source.totalFrames;
export const MATH_SECONDS = MATH_FRAMES / MATH_FPS;

export type MathChapterMode =
  | "intro" | "circle" | "identity" | "wave" | "complement" | "tangent"
  | "history" | "sound" | "astronomy" | "height" | "electric" | "final";
export type MathChapter = { id: string; title: string; start: number; end: number; mode: MathChapterMode };

export const MATH_CHAPTERS: readonly MathChapter[] = sourceManifest.sceneChapters.map((scene) => ({
  id: scene.id,
  title: scene.title,
  start: scene.startFrame,
  end: scene.endFrame,
  mode: scene.mode as MathChapterMode,
}));

export function chapterAt(frame: number): MathChapter {
  return MATH_CHAPTERS.find((chapter) => frame >= chapter.start && frame < chapter.end)
    ?? MATH_CHAPTERS[MATH_CHAPTERS.length - 1];
}

export function formatMathTime(frames: number) {
  const seconds = Math.floor(frames / MATH_FPS);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
