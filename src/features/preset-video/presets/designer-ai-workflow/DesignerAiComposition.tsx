import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { DESIGNER_AI_SEGMENTS, type DesignerAiSegment } from "./designerAiContent";
import { DesignerAiMediaStage } from "./DesignerAiMediaStage";
import {
  DesignerAiAtmosphere,
  DesignerAiHud,
  DesignerAiTransitionFlash,
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
  const segmentIndex = Math.max(0, DESIGNER_AI_SEGMENTS.indexOf(segment));
  const segmentProgress = clamp01((time - segment.start) / Math.max(0.01, segment.end - segment.start));
  const pulseRate = segment.phase === "code" ? 2.7 : 2.15;
  const punch = Math.pow(1 - ((time * pulseRate) % 1), 8);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: INK,
        color: PAPER,
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <DesignerAiAtmosphere accent={segment.accent} progress={segmentProgress} punch={punch} />
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
      <DesignerAiTransitionFlash accent={segment.accent} progress={segmentProgress} />
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
  const reveal = ease(clamp01(props.segmentProgress / 0.09));
  const holdEnd = props.portrait ? 0.34 : 0.28;
  const disappear = 1 - ease(clamp01((props.segmentProgress - holdEnd) / 0.13));
  const opacity = Math.min(reveal, disappear);
  const direction = props.segment.visualMode === "code" ? -1 : 1;
  const fontSize = props.shortestSide * (
    props.portrait ? 0.115 : props.square ? 0.105 : 0.09
  );

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? "6%" : props.square ? "6%" : "4.5%",
        right: props.portrait ? "4%" : "4.5%",
        bottom: props.portrait ? "8.5%" : props.square ? "7%" : "8%",
        opacity,
        transform: [
          `translateX(${direction * (1 - reveal) * 80}px)`,
          `translateY(${(1 - reveal) * 20}px)`,
          `scale(${0.96 + reveal * 0.04})`,
        ].join(" "),
        transformOrigin: "left bottom",
        pointerEvents: "none",
        textShadow: "0 8px 36px rgba(0,0,0,0.76)",
      }}
    >
      <div
        style={{
          display: "inline-block",
          marginBottom: props.portrait ? 10 : 8,
          width: props.portrait ? 54 : 68,
          height: props.portrait ? 5 : 6,
          borderRadius: 99,
          background: props.segment.accent,
          boxShadow: `0 0 26px ${props.segment.accent}`,
        }}
      />
      <div
        style={{
          fontSize,
          lineHeight: 0.84,
          fontWeight: 1000,
          letterSpacing: "-0.07em",
          textTransform: "uppercase",
          WebkitTextStroke: props.portrait ? "0.2px rgba(255,255,255,0.24)" : undefined,
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
