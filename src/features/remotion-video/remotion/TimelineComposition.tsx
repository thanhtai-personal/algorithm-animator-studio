import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getTimelineDurationSeconds, normalizeRemotionTimelineInput, type RemotionTimelineClip, type RemotionTimelineInputProps } from "../lib/remotionTimelineTypes";

export function TimelineComposition(rawProps: Partial<RemotionTimelineInputProps>) {
  const props = normalizeRemotionTimelineInput(rawProps);
  const { fps } = useVideoConfig();
  const visualClips = props.clips.filter((clip) => clip.type !== "audio");
  const audioClip = props.clips.find((clip) => clip.type === "audio");
  const audioAsset = audioClip ? props.assets.find((asset) => asset.id === audioClip.assetId) : undefined;
  let cursor = 0;

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
      {audioAsset ? <Audio src={staticFile(audioAsset.src)} volume={0.92} /> : null}
      <TimelineChrome title={props.title} watermark={props.watermark} durationSeconds={getTimelineDurationSeconds(props)} />
    </AbsoluteFill>
  );
}

function TimelineVisual({ clip, src, index, total, clipDurationInFrames }: { clip: RemotionTimelineClip; src: string; index: number; total: number; clipDurationInFrames: number }) {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(18, Math.max(0, Math.floor(clipDurationInFrames / 5)));
  const opacity = clip.transition === "fade"
    ? interpolate(frame, [0, fadeFrames, Math.max(fadeFrames + 1, clipDurationInFrames - fadeFrames), clipDurationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const scale = clip.transition === "zoom"
    ? interpolate(frame, [0, clipDurationInFrames], [1, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const objectFit = clip.fitMode === "contain" ? "contain" : "cover";

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden", backgroundColor: "black" }}>
      {clip.type === "video" ? (
        <OffthreadVideo src={src} muted style={{ width: "100%", height: "100%", objectFit, transform: `scale(${scale})` }} />
      ) : (
        <Img src={src} style={{ width: "100%", height: "100%", objectFit, transform: `scale(${scale})` }} />
      )}
      <div style={{ position: "absolute", right: 42, bottom: 34, borderRadius: 999, padding: "10px 18px", background: "rgba(2,6,23,0.58)", color: "rgba(226,232,240,0.86)", fontSize: 24, fontWeight: 800 }}>
        {index + 1} / {total}
      </div>
    </AbsoluteFill>
  );
}

function TimelineChrome({ title, watermark, durationSeconds }: { title: string; watermark: string; durationSeconds: number }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const time = Math.min(durationSeconds, frame / fps);
  return (
    <>
      <div style={{ position: "absolute", top: 32, left: 40, right: 40, display: "flex", justifyContent: "space-between", gap: 24, color: "rgba(226,232,240,0.86)", fontSize: 26, fontWeight: 900, textShadow: "0 3px 18px rgba(0,0,0,0.65)" }}>
        <span>{watermark}</span>
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
