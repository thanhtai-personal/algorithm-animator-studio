import { Easing } from "remotion";
import type { FivePrayersLyricCue, FivePrayersTrack } from "./fivePrayersContent";

const GOLD = "#f6d58a";

export function FivePrayersCaption(props: {
  cue: FivePrayersLyricCue;
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  const duration = Math.max(0.05, props.cue.end - props.cue.start);
  const progress = clamp01((props.time - props.cue.start) / duration);
  const enter = smoothStep(clamp01((props.time - props.cue.start) / 0.12));
  const exit = smoothStep(clamp01((props.cue.end - props.time) / 0.12));
  const words = props.cue.lines.flatMap((line) => line.split(/\s+/).filter(Boolean));
  const activeWord = Math.min(words.length - 1, Math.floor(progress * words.length));
  const fontSize = props.shortestSide * (props.portrait ? 0.052 : 0.043);
  let cursor = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 38 : "14%",
        right: props.portrait ? 38 : "14%",
        bottom: props.portrait ? "12%" : "10%",
        padding: props.portrait ? "26px 24px" : "20px 34px",
        borderRadius: 26,
        border: "1px solid rgba(246,213,138,0.28)",
        background: "linear-gradient(135deg, rgba(8,10,18,0.86), rgba(20,16,24,0.72))",
        boxShadow: "0 20px 70px rgba(0,0,0,0.42)",
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * 16}px)`,
      }}
    >
      {props.cue.lines.map((line, lineIndex) => (
        <div
          key={`${props.cue.id}-${lineIndex}`}
          style={{
            minHeight: fontSize * 1.18,
            fontSize: lineIndex === 0 ? fontSize : fontSize * 0.92,
            lineHeight: 1.13,
            fontWeight: 820,
            letterSpacing: "-0.018em",
            textShadow: "0 4px 22px rgba(0,0,0,0.82)",
          }}
        >
          {line.split(/\s+/).filter(Boolean).map((word) => {
            const index = cursor++;
            const isActive = index === activeWord;
            const isDone = index < activeWord;
            return (
              <span
                key={`${index}-${word}`}
                style={{
                  display: "inline-block",
                  marginRight: "0.26em",
                  color: isActive ? GOLD : isDone ? "#fff" : "rgba(255,255,255,0.5)",
                  transform: `scale(${isActive ? 1.045 : 1})`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function FivePrayersTrackTitle(props: {
  track: FivePrayersTrack;
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  const localTime = props.time - props.track.start;
  if (localTime < 0 || localTime > 8.5) return null;
  const reveal = smoothStep(clamp01(localTime / 1.15));
  const exit = smoothStep(clamp01((8.5 - localTime) / 1.2));
  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 48 : "10%",
        right: props.portrait ? 48 : "10%",
        top: props.portrait ? "15%" : "18%",
        textAlign: props.portrait ? "center" : "left",
        opacity: Math.min(reveal, exit),
        transform: `translateY(${(1 - reveal) * 30}px)`,
        textShadow: "0 8px 36px rgba(0,0,0,0.72)",
      }}
    >
      <div style={{ color: GOLD, fontSize: props.shortestSide * 0.025, fontWeight: 900, letterSpacing: "0.22em" }}>
        PHẦN {props.track.number} / 5
      </div>
      <div
        style={{
          marginTop: 12,
          maxWidth: props.portrait ? "100%" : "72%",
          fontSize: props.shortestSide * (props.portrait ? 0.062 : 0.058),
          lineHeight: 1.03,
          fontWeight: 900,
          letterSpacing: "-0.035em",
        }}
      >
        {props.track.title}
      </div>
      <div
        style={{
          marginTop: 12,
          maxWidth: props.portrait ? "100%" : "72%",
          color: "rgba(255,255,255,0.68)",
          fontSize: props.shortestSide * 0.023,
          lineHeight: 1.35,
        }}
      >
        {props.track.subtitle}
      </div>
    </div>
  );
}

function smoothStep(value: number) {
  return Easing.inOut(Easing.cubic)(clamp01(value));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
