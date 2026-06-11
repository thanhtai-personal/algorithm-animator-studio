import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getTimelineDurationSeconds, normalizeRemotionTimelineInput, type RemotionTimelineClip, type RemotionTimelineInputProps } from "../lib/remotionTimelineTypes";

export function TimelineComposition(rawProps: Partial<RemotionTimelineInputProps>) {
  const props = normalizeRemotionTimelineInput(rawProps);
  const { fps } = useVideoConfig();
  const visualClips = props.clips.filter((clip) => clip.type !== "audio");
  let cursor = 0;
  let audioCursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor, color: "white", fontFamily: "Inter, Arial, sans-serif" }}>
      {visualClips.length ? visualClips.map((clip, index) => {
        const asset = props.assets.find((item) => item.id === clip.assetId);
        const from = Math.round(cursor * fps);
        const durationInFrames = Math.max(1, Math.round(clip.durationSeconds * fps));
        cursor += clip.durationSeconds;
        return asset ? (
          <Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
            <TimelineVisual clip={clip} src={staticFile(asset.src)} index={index} total={visualClips.length} clipDurationInFrames={durationInFrames} />
          </Sequence>
        ) : null;
      }) : <EmptyTimeline />}
      {props.clips.filter((clip) => clip.type === "audio").map((clip) => {
        const asset = props.assets.find((item) => item.id === clip.assetId);
        const from = Math.round(audioCursor * fps);
        const durationInFrames = Math.max(1, Math.round(clip.durationSeconds * fps));
        audioCursor += clip.durationSeconds;
        return asset ? (
          <Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
            <Audio src={staticFile(asset.src)} volume={0.92} />
          </Sequence>
        ) : null;
      })}
      <TimelineChrome
        title={props.title}
        watermark={props.watermark}
        watermarkAsset={props.watermarkLogoAssetId ? props.assets.find((asset) => asset.id === props.watermarkLogoAssetId) : undefined}
        showWatermark={props.showWatermark}
        durationSeconds={getTimelineDurationSeconds(props)}
      />
    </AbsoluteFill>
  );
}

function TimelineVisual({ clip, src, index, total, clipDurationInFrames }: { clip: RemotionTimelineClip; src: string; index: number; total: number; clipDurationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const transitionFrames = Math.min(Math.floor(clipDurationInFrames / 2), Math.max(1, Math.round(clip.transitionSeconds * fps)));
  const motion = getTransitionStyle(clip.transition, frame, clipDurationInFrames, transitionFrames);
  const objectFit = clip.fitMode === "contain" ? "contain" : "cover";

  return (
    <AbsoluteFill style={{ opacity: motion.opacity, overflow: "hidden", backgroundColor: "black", filter: motion.filter, transform: motion.containerTransform }}>
      {clip.type === "video" ? (
        <OffthreadVideo src={src} muted={!clip.keepOriginalAudio} style={{ width: "100%", height: "100%", objectFit, transform: motion.mediaTransform }} />
      ) : (
        <Img src={src} style={{ width: "100%", height: "100%", objectFit, transform: motion.mediaTransform }} />
      )}
      <div style={{ position: "absolute", right: 42, bottom: 34, borderRadius: 999, padding: "10px 18px", background: "rgba(2,6,23,0.58)", color: "rgba(226,232,240,0.86)", fontSize: 24, fontWeight: 800 }}>
        {index + 1} / {total}
      </div>
    </AbsoluteFill>
  );
}

function getTransitionStyle(transition: RemotionTimelineClip["transition"], frame: number, duration: number, fadeFrames: number) {
  const endStart = Math.max(fadeFrames + 1, duration - fadeFrames);
  const edgeOpacity = interpolate(frame, [0, fadeFrames, endStart, duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enter = interpolate(frame, [0, fadeFrames || 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [endStart, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const edge = Math.max(enter, exit);
  const progress = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const base = { opacity: 1, filter: "none", containerTransform: "none", mediaTransform: "scale(1)" };

  if (transition === "none") return base;
  if (transition === "fade") return { ...base, opacity: edgeOpacity };
  if (transition === "blurry") return { ...base, opacity: edgeOpacity, filter: `blur(${edge * 18}px)`, mediaTransform: `scale(${1.04 + edge * 0.03})` };
  if (transition === "zoom-in") return { ...base, opacity: edgeOpacity, mediaTransform: `scale(${interpolate(progress, [0, 1], [1, 1.12])})` };
  if (transition === "zoom-out") return { ...base, opacity: edgeOpacity, mediaTransform: `scale(${interpolate(progress, [0, 1], [1.12, 1])})` };
  if (transition === "slide-left") return { ...base, opacity: edgeOpacity, containerTransform: `translateX(${enter * 24 - exit * 24}%)` };
  if (transition === "slide-right") return { ...base, opacity: edgeOpacity, containerTransform: `translateX(${-enter * 24 + exit * 24}%)` };
  if (transition === "slide-up") return { ...base, opacity: edgeOpacity, containerTransform: `translateY(${enter * 24 - exit * 24}%)` };
  if (transition === "slide-down") return { ...base, opacity: edgeOpacity, containerTransform: `translateY(${-enter * 24 + exit * 24}%)` };
  if (transition === "push-left") return { ...base, containerTransform: `translateX(${enter * 100 - exit * 100}%)` };
  if (transition === "push-right") return { ...base, containerTransform: `translateX(${-enter * 100 + exit * 100}%)` };
  return base;
}

function TimelineChrome({ title, watermark, watermarkAsset, showWatermark, durationSeconds }: { title: string; watermark: string; watermarkAsset?: { src: string }; showWatermark: boolean; durationSeconds: number }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const time = Math.min(durationSeconds, frame / fps);
  return (
    <>
      <div style={{ position: "absolute", top: 32, left: 40, right: 40, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, color: "rgba(226,232,240,0.86)", fontSize: 26, fontWeight: 900, textShadow: "0 3px 18px rgba(0,0,0,0.65)" }}>
        <span>{showWatermark ? (watermarkAsset ? <Img src={staticFile(watermarkAsset.src)} style={{ maxWidth: 260, maxHeight: 74, objectFit: "contain", filter: "drop-shadow(0 3px 18px rgba(0,0,0,0.65))" }} /> : watermark) : ""}</span>
        <span>{title}</span>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 26, height: 12, borderRadius: 999, background: "rgba(226,232,240,0.28)", overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "white" }} />
      </div>
      <div style={{ position: "absolute", left: 40, bottom: 48, borderRadius: 999, padding: "8px 14px", background: "rgba(2,6,23,0.58)", color: "rgba(226,232,240,0.9)", fontSize: 22, fontWeight: 800 }}>
        {time.toFixed(1)}s / {durationSeconds.toFixed(1)}s
      </div>
    </>
  );
}

function EmptyTimeline() {
  return (
    <AbsoluteFill style={{ display: "grid", placeItems: "center", background: "linear-gradient(135deg, #020617, #0f172a)" }}>
      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 42, fontWeight: 800 }}>Upload media to build a timeline</div>
    </AbsoluteFill>
  );
}
