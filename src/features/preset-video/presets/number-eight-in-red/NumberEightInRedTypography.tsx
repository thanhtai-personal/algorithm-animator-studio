import { Easing, interpolate } from "remotion";
import type { NumberEightLyricCue } from "./numberEightInRedContent";
import {
  NUMBER_EIGHT_GOLD,
  NUMBER_EIGHT_RED,
} from "./numberEightInRedTheme";

export function NumberEightLyricsCaption(props: {
  cue: NumberEightLyricCue;
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  const progress = clamp01((props.time - props.cue.start) / Math.max(0.01, props.cue.end - props.cue.start));
  const tokenCount = props.cue.lines.reduce((sum, line) => sum + line.split(/\s+/).length, 0);
  const activeToken = Math.min(tokenCount - 1, Math.floor(progress * tokenCount));
  let tokenCursor = 0;
  const enter = smoothStep(interpolate(progress, [0, 0.14], [0, 1], { extrapolateRight: "clamp" }));
  const exit = smoothStep(interpolate(progress, [0.86, 1], [1, 0], { extrapolateLeft: "clamp" }));
  const fontSize = props.shortestSide * (props.portrait ? 0.06 : 0.055);

  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 44 : "16%",
        right: props.portrait ? 44 : "16%",
        bottom: props.portrait ? "15%" : "12%",
        padding: props.portrait ? "28px 26px" : "22px 34px",
        borderRadius: 24,
        background: "linear-gradient(90deg, rgba(0,0,0,0.78), rgba(20,4,3,0.72), rgba(0,0,0,0.78))",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
        textAlign: "center",
        opacity: Math.min(enter, exit),
        transform: `translateY(${(1 - enter) * 18}px) scale(${0.98 + enter * 0.02})`,
      }}
    >
      {props.cue.lines.map((line, lineIndex) => (
        <div
          key={`${props.cue.start}-${line}`}
          style={{
            minHeight: fontSize * 1.13,
            fontSize: lineIndex === 0 ? fontSize : fontSize * 0.88,
            lineHeight: 1.08,
            fontWeight: 950,
            letterSpacing: "-0.025em",
            textTransform: "uppercase",
            textShadow: "0 4px 24px rgba(0,0,0,0.9)",
          }}
        >
          {line.split(/\s+/).map((word) => {
            const index = tokenCursor++;
            const isActive = index === activeToken;
            const isDone = index < activeToken;
            return (
              <span
                key={`${index}-${word}`}
                style={{
                  display: "inline-block",
                  marginRight: "0.28em",
                  color: isActive ? NUMBER_EIGHT_GOLD : isDone ? "#ffffff" : "rgba(255,255,255,0.48)",
                  transform: `scale(${isActive ? 1.08 : 1})`,
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

export function NumberEightOpeningTitle(props: {
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  if (props.time > 15.6) return null;
  const reveal = smoothStep(interpolate(props.time, [0.3, 2.2], [0, 1], { extrapolateRight: "clamp" }));
  const fade = interpolate(props.time, [12.4, 15.5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: props.portrait ? 54 : "11%",
        top: props.portrait ? "32%" : "27%",
        maxWidth: props.portrait ? "82%" : "56%",
        opacity: reveal * fade,
        transform: `translateY(${(1 - reveal) * 42}px)`,
        textShadow: "0 8px 40px rgba(0,0,0,0.82)",
      }}
    >
      <div
        style={{
          color: NUMBER_EIGHT_GOLD,
          fontSize: props.shortestSide * 0.035,
          fontWeight: 900,
          letterSpacing: "0.24em",
        }}
      >
        A RED ANTHEM
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: props.shortestSide * 0.105,
          lineHeight: 0.9,
          fontWeight: 1000,
          letterSpacing: "-0.06em",
        }}
      >
        NUMBER EIGHT
        <br />
        <span style={{ color: NUMBER_EIGHT_RED }}>IN RED</span>
      </div>
    </div>
  );
}

export function NumberEightOutroCard(props: {
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  if (props.time < 224.2) return null;
  const reveal = smoothStep(interpolate(props.time, [224.2, 225.3], [0, 1], { extrapolateRight: "clamp" }));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 54,
        textAlign: "center",
        background: `rgba(4,4,5,${0.42 + reveal * 0.34})`,
        opacity: reveal,
      }}
    >
      <div>
        <div
          style={{
            color: NUMBER_EIGHT_RED,
            fontSize: props.shortestSide * 0.17,
            lineHeight: 0.85,
            fontWeight: 1000,
          }}
        >
          8
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: props.shortestSide * (props.portrait ? 0.06 : 0.05),
            fontWeight: 950,
            letterSpacing: "0.04em",
          }}
        >
          BRUNO FERNANDES
        </div>
        <div
          style={{
            marginTop: 16,
            color: "rgba(255,255,255,0.64)",
            fontSize: props.shortestSide * 0.018,
            lineHeight: 1.5,
          }}
        >
          Source imagery: Manchester United official YouTube thumbnails
          <br />
          Transformed stills only · no source-video audio used
        </div>
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
