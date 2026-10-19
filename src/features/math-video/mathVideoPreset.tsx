import type { PresetVideoDefinition } from "../preset-video/types";
import { MathVideoVisual } from "./MathVideoVisual";
import { MATH_FPS, MATH_SECONDS } from "./mathTimeline";

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
  previewSections: [
    { id: "intro", label: "01", title: "Sin/Cos và tam giác", startSeconds: 0, endSeconds: 40 },
    { id: "circle", label: "02", title: "Đường tròn lượng giác", startSeconds: 40, endSeconds: 110 },
    { id: "identity", label: "03", title: "sin² + cos² = 1", startSeconds: 110, endSeconds: 170 },
    { id: "wave", label: "04", title: "Sóng sin", startSeconds: 170, endSeconds: 220 },
    { id: "tangent", label: "05", title: "Hàm tan", startSeconds: 240, endSeconds: 295 },
    { id: "height", label: "06", title: "Ứng dụng đo chiều cao", startSeconds: 425, endSeconds: 505 },
    { id: "electric", label: "07", title: "Dòng điện xoay chiều", startSeconds: 505, endSeconds: 560 },
  ],
  component: MathVideoVisual,
};
