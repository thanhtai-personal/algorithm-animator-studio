import type { CSSProperties } from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { DESIGNER_AI_SEGMENTS, type DesignerAiSegment } from "./designerAiContent";

export function DesignerAiMediaStage(props: {
  compositionProps: PresetVideoCompositionProps;
  portrait: boolean;
  square: boolean;
}) {
  const { fps } = useVideoConfig();

  return (
    <>
      {DESIGNER_AI_SEGMENTS.map((segment, index) => {
        const from = Math.round(segment.start * fps);
        const durationInFrames = Math.max(1, Math.round((segment.end - segment.start) * fps));
        return (
          <Sequence key={segment.sourceId} from={from} durationInFrames={durationInFrames} premountFor={fps}>
            <SourceStage
              src={props.compositionProps.videoSourceUrls[segment.sourceId]}
              segment={segment}
              index={index}
              portrait={props.portrait}
              square={props.square}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}
    </>
  );
}

function SourceStage(props: {
  src?: string;
  segment: DesignerAiSegment;
  index: number;
  portrait: boolean;
  square: boolean;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = clamp01(frame / Math.max(1, props.durationInFrames - 1));
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 155, mass: 0.72 } });
  const exit = interpolate(
    frame,
    [Math.max(0, props.durationInFrames - Math.round(fps * 0.2)), props.durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );
  const localSeconds = frame / fps;
  const beatRate = props.segment.phase === "code" ? 2.7 : 2.15;
  const beat = Math.pow(1 - ((localSeconds * beatRate) % 1), 9);
  const direction = props.index % 2 === 0 ? 1 : -1;
  const sharpScale = getSharpScale(props.segment, progress, beat, props.portrait);
  const sharpTranslateX = direction * (progress - 0.5) * getPanDistance(props.segment);
  const objectPosition = `${props.segment.focusX}% ${props.segment.focusY}%`;
  const stageStyle = getStageStyle(props.segment, props.portrait, props.square, enter, direction);

  return (
    <AbsoluteFill style={{ opacity: enter * exit, overflow: "hidden" }}>
      {(props.portrait || props.square) && props.src ? (
        <Video
          src={props.src}
          muted
          style={{
            position: "absolute",
            inset: "-7%",
            width: "114%",
            height: "114%",
            objectFit: "cover",
            objectPosition,
            transform: `scale(${1.12 + progress * 0.05})`,
            filter: "blur(24px) saturate(1.18) contrast(1.08) brightness(0.44)",
          }}
          fallbackOffthreadVideoProps={{
            delayRenderTimeoutInMilliseconds: 120_000,
            delayRenderRetries: 1,
          }}
        />
      ) : null}

      <div style={stageStyle}>
        {props.src ? (
          <Video
            src={props.src}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: getObjectFit(props.segment, props.portrait),
              objectPosition,
              transform: `scale(${sharpScale}) translateX(${sharpTranslateX}%)`,
              filter: "saturate(1.06) contrast(1.08) brightness(0.96)",
            }}
            fallbackOffthreadVideoProps={{
              delayRenderTimeoutInMilliseconds: 120_000,
              delayRenderRetries: 1,
            }}
          />
        ) : (
          <MissingSource accent={props.segment.accent} />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: [
              "linear-gradient(180deg, transparent 58%, rgba(3,4,8,0.5) 100%)",
              `linear-gradient(105deg, ${props.segment.accent}18, transparent 35%)`,
            ].join(","),
          }}
        />
      </div>

      <CutWipe
        accent={props.segment.accent}
        progress={progress}
        direction={direction}
        portrait={props.portrait}
      />
    </AbsoluteFill>
  );
}

function getStageStyle(
  segment: DesignerAiSegment,
  portrait: boolean,
  square: boolean,
  enter: number,
  direction: number,
): CSSProperties {
  if (!portrait && !square) {
    return {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      transform: `scale(${0.985 + enter * 0.015})`,
      background: "#07090f",
    };
  }

  if (portrait && segment.visualMode === "overview") {
    return {
      position: "absolute",
      left: "4%",
      right: "4%",
      top: "24%",
      height: "43%",
      overflow: "hidden",
      borderRadius: 28,
      background: "#07090f",
      border: `1px solid ${segment.accent}88`,
      boxShadow: `0 28px 90px rgba(0,0,0,0.58), 0 0 64px ${segment.accent}28`,
      transform: `translateY(${(1 - enter) * 32}px) rotate(${direction * (1 - enter) * 1.4}deg)`,
    };
  }

  if (portrait) {
    return {
      position: "absolute",
      left: "5%",
      right: "5%",
      top: segment.visualMode === "handoff" ? "10%" : "8%",
      height: segment.visualMode === "handoff" ? "78%" : "80%",
      overflow: "hidden",
      borderRadius: 30,
      background: "#07090f",
      border: `1px solid ${segment.accent}88`,
      boxShadow: `0 34px 120px rgba(0,0,0,0.62), 0 0 72px ${segment.accent}22`,
      transform: `translateY(${(1 - enter) * 34}px) rotate(${direction * (1 - enter) * 0.8}deg)`,
    };
  }

  return {
    position: "absolute",
    left: "4.5%",
    right: "4.5%",
    top: "5%",
    bottom: "5%",
    overflow: "hidden",
    borderRadius: 28,
    background: "#07090f",
    border: `1px solid ${segment.accent}66`,
    boxShadow: `0 30px 100px rgba(0,0,0,0.6), 0 0 64px ${segment.accent}20`,
    transform: `scale(${0.975 + enter * 0.025})`,
  };
}

function getObjectFit(segment: DesignerAiSegment, portrait: boolean) {
  if (!portrait) return "cover";
  return segment.visualMode === "overview" ? "contain" : "cover";
}

function getSharpScale(segment: DesignerAiSegment, progress: number, beat: number, portrait: boolean) {
  if (portrait && segment.visualMode === "overview") return 1 + progress * 0.035 + beat * 0.006;
  if (segment.visualMode === "handoff") return 1.06 + progress * 0.1 + beat * 0.015;
  if (segment.visualMode === "code") return 1.12 + progress * 0.13 + beat * 0.02;
  if (segment.visualMode === "detail") return 1.08 + progress * 0.12 + beat * 0.018;
  return 1.015 + progress * 0.055 + beat * 0.008;
}

function getPanDistance(segment: DesignerAiSegment) {
  if (segment.visualMode === "code") return 3.4;
  if (segment.visualMode === "detail") return 3;
  if (segment.visualMode === "handoff") return 2.4;
  return 1.5;
}

function CutWipe(props: {
  accent: string;
  progress: number;
  direction: number;
  portrait: boolean;
}) {
  if (props.progress > 0.13) return null;
  const wipeProgress = clamp01(props.progress / 0.13);
  const position = props.direction > 0 ? wipeProgress * 112 - 6 : 106 - wipeProgress * 112;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `${position}%`,
        width: props.portrait ? 5 : 7,
        background: props.accent,
        boxShadow: `0 0 34px 10px ${props.accent}88`,
        opacity: 1 - wipeProgress,
        transform: `skewX(${props.direction * -8}deg)`,
      }}
    />
  );
}

function MissingSource({ accent }: { accent: string }) {
  return (
    <AbsoluteFill
      style={{
        display: "grid",
        placeItems: "center",
        background: `radial-gradient(circle at 50% 45%, ${accent}26, transparent 44%), #0b0d14`,
      }}
    >
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.58)" }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.18em" }}>SELECT SOURCE VIDEO</div>
        <div style={{ marginTop: 9, fontSize: 13 }}>KAI Studio cuts every configured highlight automatically.</div>
      </div>
    </AbsoluteFill>
  );
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
