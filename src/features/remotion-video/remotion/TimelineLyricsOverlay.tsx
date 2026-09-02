import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoEditorLyrics } from "../../video-editor/lib/videoEditorTypes";

export function TimelineLyricsOverlay({ lyrics }: { lyrics: VideoEditorLyrics }) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  if (!lyrics.enabled || !lyrics.cues.length) return null;

  const time = frame / fps;
  const cue = lyrics.cues.find((item) => time >= item.start && time < item.end);
  if (!cue) return null;
  const duration = Math.max(0.08, cue.end - cue.start);
  const progress = Math.min(1, Math.max(0, (time - cue.start) / duration));
  const fontSize = Math.round(lyrics.fontSize * (height / 1080));
  const animation = getAnimationStyle(lyrics.animation, progress);
  const position = getPositionStyle(lyrics.position);

  return (
    <div style={{ position: "absolute", left: "6%", right: "6%", display: "flex", justifyContent: "center", textAlign: "center", pointerEvents: "none", zIndex: 20, ...position }}>
      <div style={{
        maxWidth: "100%",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        color: lyrics.textColor,
        fontSize,
        fontWeight: 900,
        lineHeight: 1.12,
        letterSpacing: "-0.02em",
        WebkitTextStroke: `${Math.max(2, fontSize * 0.055)}px ${lyrics.outlineColor}`,
        paintOrder: "stroke fill",
        textShadow: `0 4px 18px ${lyrics.outlineColor}, 0 2px 6px ${lyrics.outlineColor}`,
        ...animation,
      }}>
        {lyrics.animation === "karaoke" && cue.words.length
          ? cue.words.map((word, index) => <span key={`${cue.id}-${index}`} style={{ color: time >= word.start ? lyrics.highlightColor : lyrics.textColor }}>{word.text}</span>)
          : lyrics.animation === "typewriter"
            ? cue.text.slice(0, Math.max(1, Math.ceil(cue.text.length * progress)))
            : cue.text}
      </div>
    </div>
  );
}

function getPositionStyle(position: VideoEditorLyrics["position"]) {
  if (position === "top") return { top: "15%" };
  if (position === "center") return { top: "50%", transform: "translateY(-50%)" };
  return { bottom: "13%" };
}

function getAnimationStyle(animation: VideoEditorLyrics["animation"], progress: number) {
  const enter = interpolate(progress, [0, 0.16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(progress, [0.86, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(enter, exit);
  if (animation === "fade") return { opacity };
  if (animation === "pop") return { opacity, transform: `scale(${interpolate(enter, [0, 0.72, 1], [0.78, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` };
  if (animation === "slide-up") return { opacity, transform: `translateY(${interpolate(enter, [0, 1], [70, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` };
  return { opacity: Math.min(1, progress / 0.06) };
}
