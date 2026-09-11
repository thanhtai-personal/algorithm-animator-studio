import { AbsoluteFill } from "remotion";
import type { DesignerAiPhase } from "./designerAiContent";
import { DESIGNER_AI_DURATION_SECONDS } from "./designerAiContent";

export function DesignerAiHud(props: {
  time: number;
  phase: DesignerAiPhase;
  accent: string;
  portrait: boolean;
  shortestSide: number;
}) {
  const progress = clamp01(props.time / DESIGNER_AI_DURATION_SECONDS);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: props.portrait ? "6%" : "4.5%",
          right: props.portrait ? "6%" : "4.5%",
          top: props.portrait ? "4%" : "3.5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          fontSize: props.shortestSide * (props.portrait ? 0.018 : 0.012),
          fontWeight: 900,
          letterSpacing: "0.18em",
          textShadow: "0 3px 16px rgba(0,0,0,0.7)",
        }}
      >
        <span>DESIGNER × AI</span>
        <span style={{ color: props.accent }}>{phaseLabel(props.phase)}</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: props.portrait ? "6%" : "4.5%",
          right: props.portrait ? "6%" : "4.5%",
          bottom: props.portrait ? "3.5%" : "3.2%",
          height: props.portrait ? 5 : 4,
          borderRadius: 99,
          overflow: "hidden",
          background: "rgba(255,255,255,0.16)",
          boxShadow: "0 2px 18px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 99,
            background: props.accent,
            boxShadow: `0 0 22px ${props.accent}`,
          }}
        />
      </div>
    </>
  );
}

export function DesignerAiAtmosphere(props: {
  accent: string;
  progress: number;
  punch: number;
}) {
  return (
    <>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(circle at ${18 + props.progress * 24}% 18%, ${props.accent}28, transparent 31%)`,
            `radial-gradient(circle at 86% ${70 - props.progress * 18}%, ${props.accent}20, transparent 34%)`,
            "linear-gradient(135deg, #05060a 0%, #0a0d16 48%, #05060a 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.055,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "52px 52px",
          transform: `translateY(${props.progress * 12}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.035 + props.punch * 0.025,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.22) 4px)",
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${80 + props.punch * 36}px rgba(0,0,0,0.48)` }} />
    </>
  );
}

export function DesignerAiTransitionFlash(props: {
  accent: string;
  progress: number;
}) {
  const opacity = props.progress < 0.055
    ? (1 - props.progress / 0.055) * 0.28
    : 0;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        background: `linear-gradient(115deg, #ffffff 0%, ${props.accent} 38%, transparent 78%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}

function phaseLabel(phase: DesignerAiPhase) {
  if (phase === "code") return "CODEX";
  if (phase === "handoff") return "STITCH → CODEX";
  return "STITCH";
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
