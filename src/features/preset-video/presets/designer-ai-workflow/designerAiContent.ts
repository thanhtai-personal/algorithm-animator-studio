import type { PresetVideoPreviewSection, PresetVideoSourceClip } from "../../types";

export const DESIGNER_AI_DURATION_SECONDS = 78;
export const DESIGNER_AI_DESIGN_SOURCE_GROUP_ID = "designer-ai-stitch-session";
export const DESIGNER_AI_CODE_SOURCE_GROUP_ID = "designer-ai-codex-session";
export const DESIGNER_AI_DESIGN_SOURCE_GROUP_LABEL = "Recording 1 · Stitch design";
export const DESIGNER_AI_CODE_SOURCE_GROUP_LABEL = "Recording 2 · Codex implementation";

export type DesignerAiPhase = "design" | "handoff" | "code";
export type DesignerAiVisualMode = "overview" | "detail" | "handoff" | "code";

export type DesignerAiSegment = {
  sourceId: string;
  start: number;
  end: number;
  impact: string;
  accent: string;
  phase: DesignerAiPhase;
  visualMode: DesignerAiVisualMode;
  focusX: number;
  focusY: number;
};

export const DESIGNER_AI_SEGMENTS: readonly DesignerAiSegment[] = [
  segment("workflow-overview", 0, 6.5, "DESIGN × AI", "#a78bfa", "design", "overview", 50, 50),
  segment("workflow-mood", 6.5, 13, "EXPLORE", "#22d3ee", "design", "detail", 58, 48),
  segment("workflow-explore", 13, 20, "GENERATE", "#f472b6", "design", "detail", 63, 48),
  segment("workflow-compare", 20, 27, "CURATE", "#fbbf24", "design", "detail", 45, 50),
  segment("workflow-system", 27, 34, "SYSTEMIZE", "#34d399", "design", "overview", 52, 48),
  segment("workflow-scale", 34, 41, "SCALE", "#60a5fa", "design", "overview", 50, 50),
  segment("workflow-refine", 41, 48, "REFINE", "#c084fc", "design", "detail", 58, 50),
  segment("workflow-ship", 48, 54, "HANDOFF", "#2dd4bf", "handoff", "handoff", 50, 50),
  segment("codex-brief", 54, 60, "FRAME", "#38bdf8", "code", "code", 48, 50),
  segment("codex-run", 60, 66, "BUILD", "#818cf8", "code", "code", 52, 54),
  segment("codex-trace", 66, 72, "TRACE", "#f472b6", "code", "code", 52, 52),
  segment("codex-verify", 72, 78, "VERIFY", "#34d399", "code", "code", 50, 48),
];

export const DESIGNER_AI_VIDEO_SOURCES: readonly PresetVideoSourceClip[] = [
  source("workflow-overview", "Overview · product canvas", 8, 14.5, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-mood", "Visual directions · gradients and mood", 92, 98.5, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-explore", "AI exploration · option generation", 130, 137, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-compare", "Compare · detailed mobile variants", 182, 189, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-system", "System thinking · related screens", 238, 245, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-scale", "Scale · full interface family", 300, 307, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-refine", "Refine · focused variants", 388, 395, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("workflow-ship", "Handoff · final Stitch direction", 475, 481, DESIGNER_AI_DESIGN_SOURCE_GROUP_ID),
  source("codex-brief", "Codex brief · Stitch direction + source truth", 9, 15, DESIGNER_AI_CODE_SOURCE_GROUP_ID),
  source("codex-run", "Codex run · execute tasks.md", 46.5, 53.5, DESIGNER_AI_CODE_SOURCE_GROUP_ID),
  source("codex-trace", "Codex trace · inspect tasks and current state", 59, 65, DESIGNER_AI_CODE_SOURCE_GROUP_ID),
  source("codex-verify", "Codex verify · typecheck/build/responsive result", 34, 40, DESIGNER_AI_CODE_SOURCE_GROUP_ID),
];

export const DESIGNER_AI_PREVIEW_SECTIONS: readonly PresetVideoPreviewSection[] = [
  { id: "hook", label: "Hook", title: "Visual hook · designer × AI", startSeconds: 0, endSeconds: 13 },
  { id: "ai-loop", label: "Design loop", title: "Explore → generate → curate → systemize", startSeconds: 13, endSeconds: 34 },
  { id: "designer-value", label: "Designer value", title: "Scale → refine → handoff", startSeconds: 34, endSeconds: 54 },
  { id: "code-loop", label: "Stitch → Codex", title: "Frame → build → trace → verify", startSeconds: 54, endSeconds: 78 },
];

function segment(
  sourceId: string,
  start: number,
  end: number,
  impact: string,
  accent: string,
  phase: DesignerAiPhase,
  visualMode: DesignerAiVisualMode,
  focusX: number,
  focusY: number,
): DesignerAiSegment {
  return { sourceId, start, end, impact, accent, phase, visualMode, focusX, focusY };
}

function source(
  id: string,
  title: string,
  clipStartSeconds: number,
  clipEndSeconds: number,
  sourceGroupId: string,
): PresetVideoSourceClip {
  return {
    id,
    title,
    watchUrl: "",
    thumbnailUrl: "",
    clipStartSeconds,
    clipEndSeconds,
    sourceGroupId,
    sourceGroupLabel: sourceGroupId === DESIGNER_AI_CODE_SOURCE_GROUP_ID
      ? DESIGNER_AI_CODE_SOURCE_GROUP_LABEL
      : DESIGNER_AI_DESIGN_SOURCE_GROUP_LABEL,
  };
}
