import { useCurrentFrame } from "remotion";
import { MathChapterVisual } from "./MathChapters";
import { MathIntro } from "./MathIntro";
import { chapterAt, MATH_FRAMES, MATH_HEIGHT, MATH_WIDTH } from "./mathTimeline";
import type { PresetVideoCompositionProps } from "../preset-video/types";

export function MathVideoVisual(_props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const chapter = chapterAt(Math.min(MATH_FRAMES - 1, frame));
  return <svg viewBox={`0 0 ${MATH_WIDTH} ${MATH_HEIGHT}`} width="100%" height="100%"
    style={{ display: "block", background: "#000", fontFamily: "Arial, 'DejaVu Sans', sans-serif" }}>
    <rect width={MATH_WIDTH} height={MATH_HEIGHT} fill="#000"/>
    <text x="1247" y="40" fill="#647081" textAnchor="end" fontSize="18" fontWeight="700" letterSpacing="2.8">∞ VÔ HẠN</text>
    {chapter.mode === "intro" ? <MathIntro frame={frame}/> : <MathChapterVisual chapter={chapter} frame={frame}/>}
  </svg>;
}
