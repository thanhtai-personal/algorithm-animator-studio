import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import {
  FIVE_PRAYERS_AUDIO_ASSET,
  FIVE_PRAYERS_DURATION_SECONDS,
  getFivePrayersLyricCue,
  getFivePrayersPrayerSection,
  getFivePrayersTrack,
} from "./fivePrayersContent";
import {
  FivePrayersCaption,
  FivePrayersPrayerTitle,
  FivePrayersTrackTitle,
} from "./FivePrayersTypography";
import { FivePrayersVisuals } from "./FivePrayersVisuals";

export function FivePrayersComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = Math.min(FIVE_PRAYERS_DURATION_SECONDS, frame / fps);
  const track = getFivePrayersTrack(time);
  const prayerSection = getFivePrayersPrayerSection(time);
  const cue = getFivePrayersLyricCue(time, props.lyricTimings);
  const portrait = props.aspectRatio === "9:16";
  const shortestSide = Math.min(width, height);
  const trackProgress = clamp01((time - track.start) / Math.max(0.01, track.end - track.start));

  return (
    <AbsoluteFill
      style={{
        background: "#07080b",
        color: "white",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <FivePrayersVisuals
        track={track}
        time={time}
        portrait={portrait}
        shortestSide={shortestSide}
      />

      <header
        style={{
          position: "absolute",
          left: portrait ? 40 : 60,
          right: portrait ? 40 : 60,
          top: portrait ? 44 : 34,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
          color: "rgba(255,255,255,0.72)",
          fontSize: shortestSide * (portrait ? 0.017 : 0.015),
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textShadow: "0 3px 16px rgba(0,0,0,0.7)",
        }}
      >
        <span>5 BÀI KINH · CẦU NGUYỆN</span>
        <span>{String(track.number).padStart(2, "0")} / 05</span>
      </header>

      <FivePrayersPrayerTitle
        section={prayerSection}
        time={time}
        portrait={portrait}
        shortestSide={shortestSide}
      />

      <FivePrayersTrackTitle
        track={track}
        time={time}
        portrait={portrait}
        shortestSide={shortestSide}
      />

      {cue ? (
        <FivePrayersCaption
          cue={cue}
          time={time}
          portrait={portrait}
          shortestSide={shortestSide}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: portrait ? 40 : 60,
          right: portrait ? 40 : 60,
          bottom: portrait ? 34 : 26,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            width: 72,
            color: "rgba(255,255,255,0.6)",
            fontSize: shortestSide * 0.014,
            fontWeight: 800,
          }}
        >
          {Math.round(trackProgress * 100)}%
        </span>
        <div
          style={{
            height: 6,
            flex: 1,
            overflow: "hidden",
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${trackProgress * 100}%`,
              borderRadius: 999,
              background: "linear-gradient(90deg, #f6d58a, #fff4d4)",
              boxShadow: "0 0 20px rgba(246,213,138,0.55)",
            }}
          />
        </div>
      </div>

      <Audio src={staticFile(FIVE_PRAYERS_AUDIO_ASSET)} volume={props.originalAudioVolume} />
    </AbsoluteFill>
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
