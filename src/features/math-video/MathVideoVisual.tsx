import { useCurrentFrame } from "remotion";
import { MathChapterVisual } from "./MathChapters";
import { MathIntro } from "./MathIntro";
import { chapterAt, MATH_FRAMES, MATH_HEIGHT, MATH_WIDTH } from "./mathTimeline";
import { WHITE } from "./MathPrimitives";
import type { PresetVideoCompositionProps } from "../preset-video/types";

export function MathVideoVisual(_props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const chapter = chapterAt(Math.min(MATH_FRAMES - 1, frame));
  return <svg viewBox={`0 0 ${MATH_WIDTH} ${MATH_HEIGHT}`} width="100%" height="100%"
    style={{ display: "block", background: "#000", fontFamily: "Arial, 'DejaVu Sans', sans-serif" }}>
    <rect width={MATH_WIDTH} height={MATH_HEIGHT} fill="#000"/>
    <text x="1180" y="36" fill="#68707a" textAnchor="end" fontSize="12" fontWeight="500" letterSpacing="1.7">LÝ THUYẾT</text>
    {chapter.mode === "intro" ? <MathIntro frame={frame}/> : <MathChapterVisual chapter={chapter} frame={frame}/>}
    <rect y={MATH_HEIGHT-3} height="3" width={Math.min(MATH_WIDTH, frame / (MATH_FRAMES - 1) * MATH_WIDTH)} fill={WHITE} opacity=".25"/>
  </svg>;
}
