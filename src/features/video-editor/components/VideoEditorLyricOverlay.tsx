import { getActiveLyricCue } from "../lib/videoEditorLyrics";
import type { VideoEditorLyrics } from "../lib/videoEditorTypes";

type Props = {
  lyrics: VideoEditorLyrics;
  elapsed: number;
};

export function VideoEditorLyricOverlay({ lyrics, elapsed }: Props) {
  if (!lyrics.enabled || !lyrics.cues.length) return null;
  const cue = getActiveLyricCue(lyrics.cues, elapsed);
  if (!cue) return null;

  const duration = Math.max(0.08, cue.end - cue.start);
  const localProgress = Math.min(1, Math.max(0, (elapsed - cue.start) / duration));
  const animationStyle = getAnimationStyle(lyrics.animation, localProgress);
  const positionStyle = getPositionStyle(lyrics.position);
  const commonStyle = {
    color: lyrics.textColor,
    WebkitTextStroke: `max(1px, 0.06em) ${lyrics.outlineColor}`,
    textShadow: `0 3px 14px ${lyrics.outlineColor}, 0 1px 4px ${lyrics.outlineColor}`,
    fontSize: `clamp(18px, ${Math.max(1.8, lyrics.fontSize / 18)}vw, ${lyrics.fontSize}px)`,
  } as const;

  return (
    <div className="pointer-events-none absolute left-[6%] right-[6%] z-20 flex justify-center text-center" style={positionStyle}>
      <div className="max-w-full whitespace-pre-wrap break-words font-black leading-[1.12] tracking-tight" style={{ ...commonStyle, ...animationStyle }}>
        {lyrics.animation === "karaoke" && cue.words.length
          ? cue.words.map((word, index) => (
            <span key={`${cue.id}-${index}`} style={{ color: elapsed >= word.start ? lyrics.highlightColor : lyrics.textColor }}>
              {word.text}
            </span>
          ))
          : lyrics.animation === "typewriter"
            ? cue.text.slice(0, Math.max(1, Math.ceil(cue.text.length * localProgress)))
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
  const enter = Math.min(1, progress / 0.18);
  const exit = progress > 0.86 ? Math.max(0, (1 - progress) / 0.14) : 1;
  const opacity = Math.min(enter, exit);
  if (animation === "fade") return { opacity };
  if (animation === "pop") return { opacity, transform: `scale(${0.78 + 0.22 * easeOutBack(enter)})` };
  if (animation === "slide-up") return { opacity, transform: `translateY(${(1 - enter) * 34}px)` };
  return { opacity: Math.min(1, progress / 0.08) };
}

function easeOutBack(value: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}
