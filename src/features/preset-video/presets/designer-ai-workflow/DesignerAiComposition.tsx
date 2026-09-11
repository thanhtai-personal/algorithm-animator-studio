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
import { DesignerAiAtmosphere, DesignerAiHud } from "./DesignerAiOverlays";

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
  const punch = Math.pow(1 - ((time * 2.15) % 1), 8);

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
      <ClipDeck
        props={props}
        portrait={portrait}
        square={square}
      />
      <DesignerCopy
        segment={segment}
        segmentIndex={segmentIndex}
        segmentProgress={segmentProgress}
        portrait={portrait}
        square={square}
        shortestSide={shortestSide}
      />
      <DesignerAiHud
        time={time}
        segmentIndex={segmentIndex}
        accent={segment.accent}
        portrait={portrait}
        shortestSide={shortestSide}
      />
    </AbsoluteFill>
  );
}

function ClipDeck(props: {
  props: PresetVideoCompositionProps;
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
            <DesignerSourceFrame
              src={props.props.videoSourceUrls[segment.sourceId]}
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

function DesignerSourceFrame(props: {
  src?: string;
  segment: DesignerAiSegment;
  index: number;
  portrait: boolean;
  square: boolean;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 120, mass: 0.75 } });
  const exit = interpolate(
    frame,
    [Math.max(0, props.durationInFrames - Math.round(fps * 0.42)), props.durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );
  const progress = clamp01(frame / Math.max(1, props.durationInFrames - 1));
  const direction = props.index % 2 === 0 ? 1 : -1;
  const baseScale = props.portrait ? 1 : 1.015;
  const mediaScale = baseScale + progress * 0.035;
  const mediaTranslateX = direction * (progress - 0.5) * (props.portrait ? 1.2 : 2.2);
  const opacity = enter * exit;

  const frameStyle = props.portrait
    ? {
        left: "5%",
        right: "5%",
        top: "20%",
        height: "33%",
        borderRadius: 34,
      }
    : props.square
      ? {
          left: "6%",
          right: "6%",
          top: "11%",
          height: "56%",
          borderRadius: 30,
        }
      : {
          right: "4.5%",
          top: "11%",
          width: "62%",
          height: "70%",
          borderRadius: 30,
        };

  return (
    <div
      style={{
        position: "absolute",
        ...frameStyle,
        overflow: "hidden",
        opacity,
        transform: `translateY(${(1 - enter) * 26}px) scale(${0.985 + enter * 0.015})`,
        background: "#0b0d14",
        border: `1px solid ${props.segment.accent}55`,
        boxShadow: `0 36px 120px rgba(0,0,0,0.55), 0 0 80px ${props.segment.accent}18`,
      }}
    >
      <div
        style={{
          height: props.portrait ? 38 : 42,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 16px",
          background: "rgba(8,10,16,0.96)",
          borderBottom: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        {["#fb7185", "#fbbf24", "#34d399"].map((color) => (
          <span key={color} style={{ width: 9, height: 9, borderRadius: 99, background: color, opacity: 0.9 }} />
        ))}
        <span
          style={{
            marginLeft: 8,
            color: "rgba(255,255,255,0.42)",
            fontSize: props.portrait ? 14 : 13,
            letterSpacing: "0.08em",
          }}
        >
          DESIGN WORKSPACE · AI ASSISTED
        </span>
      </div>

      <div style={{ position: "absolute", inset: `${props.portrait ? 38 : 42}px 0 0` }}>
        {props.src ? (
          <Video
            src={props.src}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "50% 50%",
              transform: `scale(${mediaScale}) translateX(${mediaTranslateX}%)`,
              filter: "saturate(0.9) contrast(1.08) brightness(0.9)",
            }}
            fallbackOffthreadVideoProps={{
              delayRenderTimeoutInMilliseconds: 120_000,
              delayRenderRetries: 1,
            }}
          />
        ) : (
          <MissingSource accent={props.segment.accent} />
        )}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: [
            "linear-gradient(180deg, transparent 55%, rgba(5,6,10,0.46) 100%)",
            `linear-gradient(110deg, ${props.segment.accent}12, transparent 38%)`,
          ].join(","),
        }}
      />
    </div>
  );
}

function MissingSource({ accent }: { accent: string }) {
  return (
    <AbsoluteFill
      style={{
        display: "grid",
        placeItems: "center",
        background: `radial-gradient(circle at 50% 45%, ${accent}22, transparent 44%), #0b0d14`,
      }}
    >
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.52)" }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.18em" }}>SELECT SOURCE VIDEO</div>
        <div style={{ marginTop: 9, fontSize: 13 }}>KAI Studio will cut all configured highlights automatically.</div>
      </div>
    </AbsoluteFill>
  );
}

function DesignerCopy(props: {
  segment: DesignerAiSegment;
  segmentIndex: number;
  segmentProgress: number;
  portrait: boolean;
  square: boolean;
  shortestSide: number;
}) {
  const reveal = smoothStep(clamp01(props.segmentProgress / 0.18));
  const exit = smoothStep(clamp01((1 - props.segmentProgress) / 0.12));
  const opacity = Math.min(reveal, exit);
  const headlineSize = props.shortestSide * (props.portrait ? 0.084 : props.square ? 0.07 : 0.062);

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? "7%" : props.square ? "7%" : "5.5%",
        right: props.portrait ? "7%" : props.square ? "7%" : "67%",
        top: props.portrait ? "59%" : props.square ? "70%" : "25%",
        opacity,
        transform: `translateY(${(1 - reveal) * 34}px)`,
        textShadow: "0 6px 32px rgba(0,0,0,0.64)",
      }}
    >
      <div
        style={{
          color: props.segment.accent,
          fontSize: props.shortestSide * (props.portrait ? 0.024 : 0.018),
          fontWeight: 900,
          letterSpacing: "0.2em",
        }}
      >
        {props.segment.eyebrow}
      </div>
      <div
        style={{
          marginTop: props.portrait ? 18 : 14,
          whiteSpace: "pre-line",
          fontSize: headlineSize,
          lineHeight: 0.9,
          fontWeight: 1000,
          letterSpacing: "-0.055em",
        }}
      >
        {props.segment.headline}
      </div>
      <div
        style={{
          marginTop: props.portrait ? 22 : 20,
          maxWidth: props.portrait ? "96%" : 480,
          color: "rgba(248,250,252,0.72)",
          fontSize: props.shortestSide * (props.portrait ? 0.029 : 0.019),
          lineHeight: 1.42,
          fontWeight: 600,
        }}
      >
        {props.segment.supporting}
      </div>
    </div>
  );
}

function getSegment(time: number) {
  return DESIGNER_AI_SEGMENTS.find((item) => time >= item.start && time < item.end)
    || DESIGNER_AI_SEGMENTS.at(-1)
    || DESIGNER_AI_SEGMENTS[0];
}

function smoothStep(value: number) {
  return Easing.inOut(Easing.cubic)(value);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
