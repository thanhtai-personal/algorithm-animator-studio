import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import type { PresetVideoTimelineClip } from "../../types";

export function NumberEightTimelineClips(props: {
  clips: readonly PresetVideoTimelineClip[];
  videoSourceUrls: Record<string, string>;
  portrait: boolean;
}) {
  const { fps } = useVideoConfig();

  return (
    <>
      {props.clips.map((clip) => {
        const videoSrc = props.videoSourceUrls[clip.id];
        if (!videoSrc) return null;

        const from = Math.max(0, Math.round(clip.timelineStartSeconds * fps));
        const durationInFrames = Math.max(
          1,
          Math.round((clip.timelineEndSeconds - clip.timelineStartSeconds) * fps),
        );
        return (
          <Sequence
            key={clip.id}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={Math.round(fps * 3)}
          >
            <TimelineClipMedia src={videoSrc} portrait={props.portrait} />
          </Sequence>
        );
      })}
    </>
  );
}

function TimelineClipMedia(props: { src: string; portrait: boolean }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#050505" }}>
      <Video
        src={props.src}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: props.portrait ? "50% 40%" : "50% 50%",
          filter: "saturate(0.9) contrast(1.1) brightness(0.82)",
        }}
        fallbackOffthreadVideoProps={{
          delayRenderTimeoutInMilliseconds: 120_000,
          delayRenderRetries: 1,
        }}
      />
    </AbsoluteFill>
  );
}
