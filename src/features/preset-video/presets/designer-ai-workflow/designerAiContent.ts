import type { PresetVideoPreviewSection, PresetVideoSourceClip } from "../../types";

export const DESIGNER_AI_DURATION_SECONDS = 54;
export const DESIGNER_AI_SOURCE_GROUP_ID = "designer-ai-session";

export type DesignerAiSegment = {
  sourceId: string;
  start: number;
  end: number;
  eyebrow: string;
  headline: string;
  supporting: string;
  accent: string;
};

export const DESIGNER_AI_SEGMENTS: readonly DesignerAiSegment[] = [
  {
    sourceId: "workflow-overview",
    start: 0,
    end: 6.5,
    eyebrow: "01 · SEE THE SYSTEM",
    headline: "DESIGN ISN'T\nONE SCREEN ANYMORE",
    supporting: "Bắt đầu từ toàn cảnh. Đọc cả sản phẩm, không chỉ một màn hình đẹp.",
    accent: "#a78bfa",
  },
  {
    sourceId: "workflow-mood",
    start: 6.5,
    end: 13,
    eyebrow: "02 · SET DIRECTION",
    headline: "EXPLORE THE\nVISUAL SPACE",
    supporting: "AI làm việc thử nhiều hướng rẻ hơn. Gu thẩm mỹ vẫn quyết định hướng nào được giữ lại.",
    accent: "#22d3ee",
  },
  {
    sourceId: "workflow-explore",
    start: 13,
    end: 20,
    eyebrow: "03 · PROMPT + PROBE",
    headline: "ASK FASTER.\nQUESTION HARDER.",
    supporting: "Dùng AI để mở rộng phương án, rồi soi kỹ từng chi tiết trước khi chọn.",
    accent: "#f472b6",
  },
  {
    sourceId: "workflow-compare",
    start: 20,
    end: 27,
    eyebrow: "04 · COMPARE",
    headline: "VARIANTS ARE\nRAW MATERIAL",
    supporting: "Designer chuyển từ làm một đáp án sang đánh giá và chọn lọc giữa rất nhiều đáp án.",
    accent: "#fbbf24",
  },
  {
    sourceId: "workflow-system",
    start: 27,
    end: 34,
    eyebrow: "05 · SYSTEMIZE",
    headline: "TURN SCREENS\nINTO RULES",
    supporting: "Pattern, hierarchy và constraint mới biến các màn hình thành một ngôn ngữ sản phẩm.",
    accent: "#34d399",
  },
  {
    sourceId: "workflow-scale",
    start: 34,
    end: 41,
    eyebrow: "06 · SCALE",
    headline: "AI MULTIPLIES\nYOUR DECISIONS",
    supporting: "Quyết định tốt sẽ được nhân lên. Quyết định yếu cũng vậy.",
    accent: "#60a5fa",
  },
  {
    sourceId: "workflow-refine",
    start: 41,
    end: 48,
    eyebrow: "07 · REFINE",
    headline: "POLISH IS STILL\nA HUMAN LOOP",
    supporting: "Spacing, emphasis, edge case và độ rõ ràng vẫn cần con mắt phản biện của con người.",
    accent: "#c084fc",
  },
  {
    sourceId: "workflow-ship",
    start: 48,
    end: 54,
    eyebrow: "08 · SHIP",
    headline: "DESIGNER + AI\nIS THE WORKFLOW",
    supporting: "Lợi thế không phải generate nhiều hơn, mà là quyết định tốt hơn và nhanh hơn.",
    accent: "#2dd4bf",
  },
];

export const DESIGNER_AI_VIDEO_SOURCES: readonly PresetVideoSourceClip[] = [
  source("workflow-overview", "Overview · product canvas", 8, 14.5),
  source("workflow-mood", "Visual directions · gradients and mood", 92, 98.5),
  source("workflow-explore", "AI exploration · option generation", 130, 137),
  source("workflow-compare", "Compare · detailed mobile variants", 182, 189),
  source("workflow-system", "System thinking · related screens", 238, 245),
  source("workflow-scale", "Scale · full interface family", 300, 307),
  source("workflow-refine", "Refine · focused variants", 388, 395),
  source("workflow-ship", "Ship · final canvas overview", 475, 481),
];

export const DESIGNER_AI_PREVIEW_SECTIONS: readonly PresetVideoPreviewSection[] = [
  { id: "hook", label: "Hook", title: "Design is not one screen anymore", startSeconds: 0, endSeconds: 13 },
  { id: "ai-loop", label: "AI loop", title: "Explore → compare → systemize", startSeconds: 13, endSeconds: 34 },
  { id: "designer-value", label: "Designer value", title: "Scale → refine → ship", startSeconds: 34, endSeconds: 54 },
];

function source(id: string, title: string, clipStartSeconds: number, clipEndSeconds: number): PresetVideoSourceClip {
  return {
    id,
    title,
    watchUrl: "",
    thumbnailUrl: "",
    clipStartSeconds,
    clipEndSeconds,
    sourceGroupId: DESIGNER_AI_SOURCE_GROUP_ID,
  };
}
