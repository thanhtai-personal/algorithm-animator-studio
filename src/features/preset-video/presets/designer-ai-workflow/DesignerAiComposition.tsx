import {
  AbsoluteFill,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { DESIGNER_AI_SEGMENTS, type DesignerAiSegment } from "./designerAiContent";
import { DesignerAiMediaStage } from "./DesignerAiMediaStage";
import {
  DesignerAiAtmosphere,
  DesignerAiHud,
} from "./DesignerAiOverlays";

const INK = "#06070b";
const PAPER = "#f8fafc";

export function DesignerAiComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const portrait = props.aspectRatio === "9:16";
  const square = props.aspectRatio === "1:1";
  const shortestSide = Math.min(width, height);
  const segment = getSegment(time);
  const segmentProgress = clamp01((time - segment.start) / Math.max(0.01, segment.end - segment.start));

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: INK,
        color: PAPER,
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <DesignerAiAtmosphere accent={segment.accent} time={time} />
      <DesignerAiMediaStage compositionProps={props} portrait={portrait} square={square} />
      <ImpactWord
        segment={segment}
        segmentProgress={segmentProgress}
        portrait={portrait}
        square={square}
        shortestSide={shortestSide}
      />
      <DesignerAiHud
        time={time}
        phase={segment.phase}
        accent={segment.accent}
        portrait={portrait}
        shortestSide={shortestSide}
      />
    </AbsoluteFill>
  );
}

function ImpactWord(props: {
  segment: DesignerAiSegment;
  segmentProgress: number;
  portrait: boolean;
  square: boolean;
  shortestSide: number;
}) {
  const reveal = ease(clamp01(props.segmentProgress / 0.12));
  const holdEnd = props.portrait ? 0.34 : 0.25;
  const disappear = 1 - ease(clamp01((props.segmentProgress - holdEnd) / 0.16));
  const opacity = Math.min(reveal, disappear);
  const fontSize = props.shortestSide * (
    props.portrait ? 0.105 : props.square ? 0.095 : 0.075
  );

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? "6%" : props.square ? "6%" : "4.5%",
        right: props.portrait ? "4%" : "4.5%",
        bottom: props.portrait ? "8.5%" : props.square ? "7%" : "8%",
        opacity,
        transform: `translateY(${(1 - reveal) * 22}px) scale(${0.985 + reveal * 0.015})`,
        transformOrigin: "left bottom",
        pointerEvents: "none",
        textShadow: "0 8px 36px rgba(0,0,0,0.76)",
      }}
    >
      <div
        style={{
          display: "inline-block",
          marginBottom: props.portrait ? 10 : 8,
          width: props.portrait ? 48 : 58,
          height: props.portrait ? 4 : 5,
          borderRadius: 99,
          background: props.segment.accent,
          boxShadow: `0 0 18px ${props.segment.accent}88`,
        }}
      />
      <div
        style={{
          fontSize,
          lineHeight: 0.88,
          fontWeight: 950,
          letterSpacing: "-0.055em",
          textTransform: "uppercase",
        }}
      >
        {props.segment.impact}
      </div>
    </div>
  );
}

function getSegment(time: number) {
  return DESIGNER_AI_SEGMENTS.find((item) => time >= item.start && time < item.end)
    || DESIGNER_AI_SEGMENTS[DESIGNER_AI_SEGMENTS.length - 1]
    || DESIGNER_AI_SEGMENTS[0];
}

function ease(value: number) {
  return Easing.out(Easing.cubic)(value);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
