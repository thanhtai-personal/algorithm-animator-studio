import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  continueRender,
  delayRender,
} from "remotion";
import { Video } from "@remotion/media";
import type { PresetVideoTimelineClip } from "../../types";
import { NumberEightTimelineClips } from "./NumberEightTimelineClips";
import {
  NUMBER_EIGHT_VISUAL_SOURCES,
  getNumberEightSource,
  type NumberEightSection,
} from "./numberEightInRedContent";
import {
  NUMBER_EIGHT_GOLD,
  NUMBER_EIGHT_RED,
} from "./numberEightInRedTheme";

type RemoteImageStatus = "loaded" | "failed";

const remoteImageStatus = new Map<string, RemoteImageStatus>();

export function NumberEightVisualLayer(props: {
  section: NumberEightSection;
  time: number;
  beatPulse: number;
  portrait: boolean;
  videoSourceUrls: Record<string, string>;
  timelineVideoClips: readonly PresetVideoTimelineClip[];
}) {
  const slot = getVisualSlot(props.section, props.time);
  const current = getNumberEightSource(slot.currentSourceId);
  const previous = getNumberEightSource(slot.previousSourceId);
  const next = getNumberEightSource(slot.nextSourceId);
  const transition = smoothStep(clamp01(slot.localTime / 0.65));
  const currentTransform = mediaTransform(
    props.section.visualMode,
    slot.progress,
    slot.index,
    props.beatPulse,
    props.portrait,
  );
  const previousTransform = mediaTransform(
    props.section.visualMode,
    clamp01(slot.progress + 0.08),
    Math.max(0, slot.index - 1),
    props.beatPulse,
    props.portrait,
  );
  const isSameSource = previous.id === current.id;
  const activeTimelineClip = [...props.timelineVideoClips]
    .reverse()
    .find((clip) => props.time >= clip.timelineStartSeconds && props.time < clip.timelineEndSeconds);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(135deg, #050505, #260805 60%, #050505)" }}>
      {NUMBER_EIGHT_VISUAL_SOURCES.filter((source) => (
        source.id === current.id || source.id === previous.id || source.id === next.id
      )).map((source) => {
        const isCurrent = source.id === current.id;
        const isPrevious = !isSameSource && source.id === previous.id;
        const opacity = isCurrent ? (isSameSource ? 1 : transition) : isPrevious ? 1 - transition : 0;
        return (
          <SourceMedia
            key={source.id}
            imageSrc={source.thumbnailUrl}
            videoSrc={props.videoSourceUrls[source.id]}
            opacity={opacity}
            transform={isPrevious ? previousTransform : currentTransform}
            portrait={props.portrait}
            frozen={props.section.visualMode === "freeze" && isCurrent}
          />
        );
      })}

      <NumberEightTimelineClips
        clips={props.timelineVideoClips}
        videoSourceUrls={props.videoSourceUrls}
        portrait={props.portrait}
      />

      <AbsoluteFill
        style={{
          background: [
            "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.72) 100%)",
            "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 42%, rgba(0,0,0,0.46) 100%)",
            "radial-gradient(circle at 50% 45%, transparent 0%, rgba(0,0,0,0.22) 56%, rgba(0,0,0,0.75) 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          background: `rgba(170, 10, 0, ${props.section.visualMode === "anthem" ? 0.22 : 0.13})`,
          mixBlendMode: "color",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 54,
          maxWidth: "56%",
          color: "rgba(255,255,255,0.52)",
          fontSize: 14,
          letterSpacing: "0.08em",
          textAlign: "right",
          textTransform: "uppercase",
          textShadow: "0 3px 14px rgba(0,0,0,0.9)",
        }}
      >
        {activeTimelineClip?.title || current.title}
      </div>
    </AbsoluteFill>
  );
}

function SourceMedia(props: {
  imageSrc: string;
  videoSrc?: string;
  opacity: number;
  transform: string;
  portrait: boolean;
  frozen: boolean;
}) {
  const mediaStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    objectPosition: props.portrait ? "50% 38%" : "50% 50%",
    transform: props.transform,
    filter: "saturate(0.88) contrast(1.12) brightness(0.8)",
  };
  const video = props.videoSrc ? (
    <Video
      src={props.videoSrc}
      muted
      loop
      playbackRate={props.frozen ? 1 : 0.82}
      style={mediaStyle}
      onError={(error) => {
        console.error("Number Eight background clip decode failed", error);
        return "fallback";
      }}
      fallbackOffthreadVideoProps={{
        delayRenderTimeoutInMilliseconds: 120_000,
        delayRenderRetries: 1,
      }}
    />
  ) : null;

  return (
    <AbsoluteFill
      style={{
        opacity: props.opacity,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <SourceImage src={props.imageSrc} transform={props.transform} portrait={props.portrait} />
      {video ? <Freeze frame={18} active={props.frozen}>{video}</Freeze> : null}
    </AbsoluteFill>
  );
}

function SourceImage(props: { src: string; transform: string; portrait: boolean }) {
  const cachedStatus = remoteImageStatus.get(props.src);
  const [isLoaded, setIsLoaded] = useState(cachedStatus === "loaded");
  const [renderHandle] = useState(() => (
    cachedStatus ? null : delayRender(`Loading official source still: ${props.src}`)
  ));

  useEffect(() => {
    if (cachedStatus || renderHandle === null) return;

    const image = new Image();
    let isFinished = false;
    const finish = (status: RemoteImageStatus, shouldUpdateState = true) => {
      if (isFinished) return;
      isFinished = true;
      remoteImageStatus.set(props.src, status);
      if (shouldUpdateState) setIsLoaded(status === "loaded");
      continueRender(renderHandle);
    };
    const timeout = window.setTimeout(() => finish("failed"), 3_000);
    image.onload = () => finish("loaded");
    image.onerror = () => finish("failed");
    image.src = props.src;

    return () => {
      window.clearTimeout(timeout);
      finish("failed", false);
    };
  }, [cachedStatus, props.src, renderHandle]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {isLoaded ? (
        <img
          src={props.src}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: props.portrait ? "50% 38%" : "50% 50%",
            transform: props.transform,
            filter: "saturate(0.82) contrast(1.12) brightness(0.78)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}

export function NumberEightTacticalOverlay(props: {
  width: number;
  height: number;
  time: number;
  sectionProgress: number;
  beatPulse: number;
}) {
  const travel = (props.time * 0.19) % 1;
  const dashOffset = 320 * (1 - props.sectionProgress);
  const lineY = props.height * (0.27 + Math.sin(props.time * 0.45) * 0.035);
  return (
    <svg
      viewBox={`0 0 ${props.width} ${props.height}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.72 }}
    >
      <path
        d={`M ${props.width * 0.08} ${lineY} C ${props.width * 0.32} ${props.height * 0.12}, ${props.width * 0.62} ${props.height * 0.7}, ${props.width * 0.92} ${props.height * 0.34}`}
        fill="none"
        stroke="rgba(255,255,255,0.24)"
        strokeWidth={Math.max(3, props.width * 0.0022)}
        strokeDasharray="24 18"
        strokeDashoffset={dashOffset}
      />
      <circle
        cx={props.width * (0.08 + travel * 0.84)}
        cy={lineY + Math.sin(travel * Math.PI * 2) * props.height * 0.09}
        r={12 + props.beatPulse * 9}
        fill={NUMBER_EIGHT_GOLD}
        opacity={0.86}
      />
      {[0.18, 0.46, 0.76].map((x, index) => (
        <g key={x}>
          <circle
            cx={props.width * x}
            cy={props.height * (0.38 + (index % 2) * 0.18)}
            r={34 + props.beatPulse * 10}
            fill="none"
            stroke="rgba(218,41,28,0.6)"
            strokeWidth={5}
          />
          <circle
            cx={props.width * x}
            cy={props.height * (0.38 + (index % 2) * 0.18)}
            r={8}
            fill="rgba(255,255,255,0.72)"
          />
        </g>
      ))}
    </svg>
  );
}

export function NumberEightAtmosphere({ beatPulse }: { beatPulse: number }) {
  return (
    <>
      <AbsoluteFill
        style={{
          boxShadow: `inset 0 0 ${110 + beatPulse * 80}px rgba(218,41,28,${0.18 + beatPulse * 0.12})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.34) 4px)",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}

export function NumberEightMark(props: {
  portrait: boolean;
  square: boolean;
  shortestSide: number;
  beatPulse: number;
  sectionProgress: number;
}) {
  const size = props.shortestSide * (props.portrait ? 0.8 : props.square ? 0.7 : 0.72);
  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? "50%" : "7%",
        top: props.portrait ? "18%" : "13%",
        transform: props.portrait ? "translateX(-50%)" : "none",
        fontSize: size,
        lineHeight: 0.82,
        fontWeight: 1000,
        letterSpacing: "-0.12em",
        color: "transparent",
        WebkitTextStroke: `${Math.max(3, props.shortestSide * 0.006)}px rgba(255,255,255,0.1)`,
        opacity: 0.68 + props.beatPulse * 0.18,
        filter: `blur(${(1 - props.sectionProgress) * 0.3}px)`,
        userSelect: "none",
      }}
    >
      8
    </div>
  );
}

function getVisualSlot(section: NumberEightSection, time: number) {
  const localSectionTime = Math.max(0, time - section.start);
  const index = Math.floor(localSectionTime / section.holdSeconds);
  const localTime = localSectionTime - index * section.holdSeconds;
  const progress = clamp01(localTime / section.holdSeconds);
  const currentSourceId = section.sourceIds[index % section.sourceIds.length];
  const previousSourceId = section.sourceIds[(index - 1 + section.sourceIds.length) % section.sourceIds.length];
  const nextSourceId = section.sourceIds[(index + 1) % section.sourceIds.length];
  return { index, localTime, progress, currentSourceId, previousSourceId, nextSourceId };
}

function mediaTransform(
  mode: NumberEightSection["visualMode"],
  progress: number,
  index: number,
  beatPulse: number,
  portrait: boolean,
) {
  const portraitCrop = portrait ? 0.12 : 0;
  if (mode === "freeze") return `scale(${1.035 + portraitCrop + beatPulse * 0.004}) translate3d(0, 0, 0)`;
  if (mode === "slow") return `scale(${1.02 + portraitCrop + progress * 0.07}) translate3d(${(progress - 0.5) * 1.8}%, 0, 0)`;
  if (mode === "drive") {
    const direction = index % 2 === 0 ? 1 : -1;
    return `scale(${1.08 + portraitCrop + progress * 0.08}) translate3d(${direction * (progress - 0.5) * 3.5}%, ${Math.sin(progress * Math.PI) * -1.5}%, 0)`;
  }
  return `scale(${1.055 + portraitCrop + progress * 0.07 + beatPulse * 0.009}) translate3d(${(index % 2 ? -1 : 1) * (progress - 0.5) * 2.4}%, 0, 0)`;
}

function smoothStep(value: number) {
  return Easing.inOut(Easing.cubic)(clamp01(value));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
