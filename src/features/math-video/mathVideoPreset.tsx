import type { PresetVideoDefinition } from "../preset-video/types";
import { MathVideoVisual } from "./MathVideoVisual";
import { MATH_CHAPTERS, MATH_FPS, MATH_SECONDS } from "./mathTimeline";

export const mathVideoPreset: PresetVideoDefinition = {
  id: "math-sincos-v1",
  name: "Math Video — Sin & Cos",
  description: "Tái dựng bằng code SVG/Remotion nội dung video lượng giác (bản dựng đầu, timeline xấp xỉ, đang cần đối chiếu nguồn).",
  tags: ["math", "sin", "cos", "remotion", "geometry"],
  accentColor: "#58dfea",
  defaultDurationSeconds: MATH_SECONDS,
  defaultFps: MATH_FPS,
  defaultOutputPreset: "landscape-720p",
  hasOriginalAudio: false,
  previewSections: MATH_CHAPTERS.map((chapter, index) => ({
    id: chapter.id,
    label: String(index + 1).padStart(2, "0"),
    title: chapter.title,
    startSeconds: chapter.start / MATH_FPS,
    endSeconds: chapter.end / MATH_FPS,
  })),
  component: MathVideoVisual,
};
