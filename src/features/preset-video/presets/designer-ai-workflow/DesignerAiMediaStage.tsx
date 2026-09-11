import type { CSSProperties } from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
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
  const cameraProgress = Easing.inOut(Easing.cubic)(progress);
  const entrance = interpolate(
    frame,
    [0, Math.round(fps * 0.42)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  const direction = props.index % 2 === 0 ? 1 : -1;
  const cameraScale = getCameraScale(props.segment, cameraProgress, props.portrait, props.square);
  const cameraPan = getCameraPan(cameraProgress, direction, props.portrait, props.square);
  const portraitFocus = getPortraitFocus(
    props.segment,
    cameraProgress,
    direction,
  );
  const objectPosition = props.portrait
    ? `${portraitFocus.x}% ${portraitFocus.y}%`
    : `${props.segment.focusX}% ${props.segment.focusY}%`;
  const stageStyle = getStageStyle(props.segment, props.portrait, props.square, entrance);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {props.square && props.src ? (
        <Video
          src={props.src}
          muted
          style={{
            position: "absolute",
            inset: "-5%",
            width: "110%",
            height: "110%",
            objectFit: "cover",
            objectPosition,
            transform: `scale(${1.035 + cameraProgress * 0.012})`,
            filter: "blur(26px) saturate(1.08) contrast(1.04) brightness(0.4)",
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
              objectFit: "cover",
              objectPosition,
              transform: `scale(${cameraScale}) translate(${cameraPan.x}%, ${cameraPan.y}%)`,
              transformOrigin: props.portrait
                ? `${portraitFocus.x}% ${portraitFocus.y}%`
                : `${props.segment.focusX}% ${props.segment.focusY}%`,
              filter: "saturate(1.035) contrast(1.045) brightness(0.985)",
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
              "linear-gradient(180deg, transparent 64%, rgba(3,4,8,0.44) 100%)",
              `linear-gradient(110deg, ${props.segment.accent}0f, transparent 40%)`,
            ].join(","),
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

function getStageStyle(
  segment: DesignerAiSegment,
  portrait: boolean,
  square: boolean,
  entrance: number,
): CSSProperties {
  const settleY = (1 - entrance) * (portrait ? 14 : 7);

  if (!portrait && !square) {
    return {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      transform: `translateY(${settleY}px) scale(${0.995 + entrance * 0.005})`,
      background: "#07090f",
    };
  }

  if (portrait) {
    return {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      background: "#07090f",
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
    border: `1px solid ${segment.accent}55`,
    boxShadow: `0 30px 100px rgba(0,0,0,0.6), 0 0 48px ${segment.accent}18`,
    transform: `translateY(${settleY}px) scale(${0.995 + entrance * 0.005})`,
  };
}

function getCameraScale(
  segment: DesignerAiSegment,
  progress: number,
  portrait: boolean,
  square: boolean,
) {
  if (portrait) {
    if (segment.visualMode === "overview") return 1.01 + progress * 0.012;
    if (segment.visualMode === "handoff") return 1.015 + progress * 0.016;
    if (segment.visualMode === "code") return 1.018 + progress * 0.018;
    return 1.015 + progress * 0.02;
  }

  if (square) {
    if (segment.visualMode === "detail" || segment.visualMode === "code") {
      return 1.008 + progress * 0.026;
    }
    return 1 + progress * 0.016;
  }

  if (segment.visualMode === "detail" || segment.visualMode === "code") {
    return 1 + progress * 0.014;
  }

  return 1 + progress * 0.008;
}

function getCameraPan(
  progress: number,
  direction: number,
  portrait: boolean,
  square: boolean,
) {
  const centeredProgress = progress - 0.5;

  if (portrait) {
    return {
      x: 0,
      y: centeredProgress * 0.18,
    };
  }

  if (square) {
    return { x: direction * centeredProgress * 0.7, y: centeredProgress * 0.2 };
  }

  return { x: direction * centeredProgress * 0.3, y: 0 };
}


function getPortraitFocus(
  segment: DesignerAiSegment,
  progress: number,
  direction: number,
) {
  const sweepDistance = segment.visualMode === "overview"
    ? 24
    : segment.visualMode === "detail"
      ? 13
      : segment.visualMode === "handoff"
        ? 9
        : 7;
  const offset = (progress * 2 - 1) * sweepDistance * direction;

  return {
    x: clamp(segment.focusX + offset, 8, 92),
    y: clamp(segment.focusY, 18, 82),
  };
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}
