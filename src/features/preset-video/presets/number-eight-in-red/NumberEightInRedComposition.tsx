import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import {
  NUMBER_EIGHT_BPM,
  NUMBER_EIGHT_DURATION_SECONDS,
  NUMBER_EIGHT_FIRST_BEAT_SECONDS,
  getNumberEightLyricCue,
  getNumberEightSection,
} from "./numberEightInRedContent";
import {
  NumberEightAtmosphere,
  NumberEightMark,
  NumberEightTacticalOverlay,
  NumberEightVisualLayer,
} from "./NumberEightInRedVisuals";
import {
  NumberEightLyricsCaption,
  NumberEightOpeningTitle,
  NumberEightOutroCard,
} from "./NumberEightInRedTypography";
import {
  NUMBER_EIGHT_AUDIO_ASSET,
  NUMBER_EIGHT_GOLD,
  NUMBER_EIGHT_INK,
  NUMBER_EIGHT_RED,
} from "./numberEightInRedTheme";

export function NumberEightInRedComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = Math.min(NUMBER_EIGHT_DURATION_SECONDS, frame / fps);
  const section = getNumberEightSection(time);
  const cue = getNumberEightLyricCue(time, props.lyricTimings);
  const portrait = props.aspectRatio === "9:16";
  const square = props.aspectRatio === "1:1";
  const shortestSide = Math.min(width, height);
  const beat = Math.max(0, (time - NUMBER_EIGHT_FIRST_BEAT_SECONDS) * NUMBER_EIGHT_BPM / 60);
  const beatPulse = Math.pow(1 - (beat % 1), 5);
  const sectionProgress = clamp01((time - section.start) / Math.max(0.01, section.end - section.start));

  return (
    <AbsoluteFill style={{ backgroundColor: NUMBER_EIGHT_INK, color: "white", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <NumberEightVisualLayer section={section} time={time} beatPulse={beatPulse} portrait={portrait} videoSourceUrls={props.videoSourceUrls} />
      <NumberEightTacticalOverlay
        width={width}
        height={height}
        time={time}
        sectionProgress={sectionProgress}
        beatPulse={beatPulse}
      />
      <NumberEightAtmosphere beatPulse={beatPulse} />

      <header
        style={{
          position: "absolute",
          left: portrait ? 54 : 72,
          right: portrait ? 54 : 72,
          top: portrait ? 58 : 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          fontSize: portrait ? 22 : 20,
          letterSpacing: "0.18em",
          fontWeight: 900,
          textTransform: "uppercase",
          textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 42, height: 5, background: NUMBER_EIGHT_RED, borderRadius: 999 }} />
          <span>{section.label}</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: portrait ? 16 : 15 }}>
          @manutd source clip
        </span>
      </header>

      <NumberEightMark
        portrait={portrait}
        square={square}
        shortestSide={shortestSide}
        beatPulse={beatPulse}
        sectionProgress={sectionProgress}
      />

      {cue ? (
        <NumberEightLyricsCaption
          cue={cue}
          time={time}
          portrait={portrait}
          shortestSide={shortestSide}
        />
      ) : null}

      <NumberEightOpeningTitle time={time} portrait={portrait} shortestSide={shortestSide} />
      <NumberEightOutroCard time={time} portrait={portrait} shortestSide={shortestSide} />

      <div
        style={{
          position: "absolute",
          left: portrait ? 54 : 72,
          right: portrait ? 54 : 72,
          bottom: portrait ? 42 : 32,
          height: 7,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamp01(time / NUMBER_EIGHT_DURATION_SECONDS) * 100}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${NUMBER_EIGHT_RED}, ${NUMBER_EIGHT_GOLD})`,
          }}
        />
      </div>

      <Audio src={staticFile(NUMBER_EIGHT_AUDIO_ASSET)} volume={props.originalAudioVolume} />
    </AbsoluteFill>
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
