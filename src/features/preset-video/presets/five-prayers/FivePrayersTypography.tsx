import { Easing } from "remotion";
import type {
  FivePrayersLyricCue,
  FivePrayersPrayerSection,
  FivePrayersTrack,
} from "./fivePrayersContent";

const GOLD = "#f6d58a";
const IVORY = "#fff9ea";
const LYRIC_FONT = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, "Times New Roman", serif';

export function FivePrayersCaption(props: {
  cue: FivePrayersLyricCue;
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  const duration = Math.max(0.05, props.cue.end - props.cue.start);
  const progress = clamp01((props.time - props.cue.start) / duration);
  const enter = smoothStep(clamp01((props.time - props.cue.start) / 0.24));
  const exit = smoothStep(clamp01((props.cue.end - props.time) / 0.18));
  const words = props.cue.lines.flatMap((line) => line.split(/\s+/).filter(Boolean));
  const wordCursor = progress * words.length;
  const activeWord = Math.min(words.length - 1, Math.floor(wordCursor));
  const fontSize = props.shortestSide * (props.portrait ? 0.058 : 0.047);
  let cursor = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 34 : "12%",
        right: props.portrait ? 34 : "12%",
        bottom: props.portrait ? "11%" : "9.5%",
        padding: props.portrait ? "28px 24px 24px" : "22px 42px 24px",
        borderRadius: 30,
        background: "linear-gradient(180deg, rgba(5,7,12,0.1), rgba(5,7,12,0.72) 42%, rgba(5,7,12,0.84))",
        boxShadow: "0 28px 90px rgba(0,0,0,0.36)",
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * 22}px) scale(${0.985 + enter * 0.015})`,
      }}
    >
      <div
        style={{
          width: `${28 + progress * 42}%`,
          height: 2,
          margin: "0 auto 14px",
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          boxShadow: `0 0 ${10 + progress * 12}px rgba(246,213,138,0.55)`,
          opacity: 0.48 + enter * 0.32,
        }}
      />
      {props.cue.lines.map((line, lineIndex) => (
        <div
          key={`${props.cue.id}-${lineIndex}`}
          style={{
            minHeight: fontSize * 1.22,
            fontFamily: LYRIC_FONT,
            fontSize: lineIndex === 0 ? fontSize : fontSize * 0.94,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: "0.006em",
            textShadow: "0 5px 24px rgba(0,0,0,0.94)",
          }}
        >
          {line.split(/\s+/).filter(Boolean).map((word) => {
            const index = cursor++;
            const distance = Math.abs(index - wordCursor);
            const pulse = smoothStep(clamp01(1 - distance));
            const isActive = index === activeWord;
            const isDone = index < activeWord;
            return (
              <span
                key={`${index}-${word}`}
                style={{
                  display: "inline-block",
                  marginRight: "0.24em",
                  color: isActive ? GOLD : isDone ? IVORY : "rgba(255,249,234,0.58)",
                  opacity: isDone ? 0.94 : 0.72 + pulse * 0.28,
                  transform: `translateY(${-pulse * 5}px) scale(${1 + pulse * 0.075})`,
                  transformOrigin: "50% 78%",
                  textShadow: isActive
                    ? "0 0 16px rgba(246,213,138,0.68), 0 5px 22px rgba(0,0,0,0.94)"
                    : "0 5px 22px rgba(0,0,0,0.94)",
                  transition: "none",
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

export function FivePrayersPrayerTitle(props: {
  section: FivePrayersPrayerSection;
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  const localTime = Math.max(0, props.time - props.section.start);
  const enter = smoothStep(clamp01(localTime / 0.48));
  const breathe = 0.5 + Math.sin(localTime * 1.15) * 0.5;

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 42 : "18%",
        right: props.portrait ? 42 : "18%",
        top: props.portrait ? 92 : 74,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: 0.72 + enter * 0.28,
        transform: `translateY(${(1 - enter) * 10}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          padding: props.portrait ? "11px 20px 12px" : "9px 24px 10px",
          border: "1px solid rgba(246,213,138,0.26)",
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(7,8,12,0.58), rgba(24,18,17,0.72), rgba(7,8,12,0.58))",
          boxShadow: `0 8px 38px rgba(0,0,0,0.34), 0 0 ${12 + breathe * 10}px rgba(246,213,138,0.12)`,
          color: IVORY,
          fontFamily: LYRIC_FONT,
          fontSize: props.shortestSide * (props.portrait ? 0.027 : 0.023),
          fontWeight: 700,
          letterSpacing: "0.025em",
          lineHeight: 1.12,
          textAlign: "center",
          textShadow: "0 3px 18px rgba(0,0,0,0.86)",
        }}
      >
        <span style={{ color: GOLD, marginRight: "0.52em" }}>✦</span>
        {props.section.title}
        <span style={{ color: GOLD, marginLeft: "0.52em" }}>✦</span>
      </div>
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
  const reveal = smoothStep(clamp01(localTime / 0.95));
  const exit = smoothStep(clamp01((8.5 - localTime) / 1.1));

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 48 : "10%",
        right: props.portrait ? 48 : "10%",
        top: props.portrait ? "15%" : "17%",
        textAlign: props.portrait ? "center" : "left",
        opacity: Math.min(reveal, exit),
        transform: `translateY(${(1 - reveal) * 30}px) scale(${0.98 + reveal * 0.02})`,
        textShadow: "0 8px 36px rgba(0,0,0,0.78)",
      }}
    >
      <div
        style={{
          color: GOLD,
          fontSize: props.shortestSide * 0.022,
          fontWeight: 800,
          letterSpacing: "0.19em",
        }}
      >
        PHẦN {props.track.number} / 5
      </div>
      <div
        style={{
          marginTop: 12,
          maxWidth: props.portrait ? "100%" : "76%",
          fontFamily: LYRIC_FONT,
          fontSize: props.shortestSide * (props.portrait ? 0.064 : 0.058),
          lineHeight: 1.02,
          fontWeight: 700,
          letterSpacing: "-0.015em",
        }}
      >
        {props.track.title}
      </div>
      <div
        style={{
          marginTop: 12,
          maxWidth: props.portrait ? "100%" : "76%",
          color: "rgba(255,249,234,0.72)",
          fontFamily: LYRIC_FONT,
          fontSize: props.shortestSide * 0.024,
          lineHeight: 1.28,
          fontStyle: "italic",
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
