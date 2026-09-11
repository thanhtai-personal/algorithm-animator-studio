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
          fontWeight: 850,
          letterSpacing: "0.16em",
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
          height: props.portrait ? 4 : 3,
          borderRadius: 99,
          overflow: "hidden",
          background: "rgba(255,255,255,0.14)",
          boxShadow: "0 2px 18px rgba(0,0,0,0.34)",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 99,
            background: props.accent,
          }}
        />
      </div>
    </>
  );
}

export function DesignerAiAtmosphere(props: {
  accent: string;
  time: number;
}) {
  const driftX = 24 + Math.sin(props.time * 0.18) * 5;
  const driftY = 68 + Math.cos(props.time * 0.14) * 6;

  return (
    <>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(circle at ${driftX}% 20%, ${props.accent}1f, transparent 34%)`,
            `radial-gradient(circle at 84% ${driftY}%, ${props.accent}18, transparent 38%)`,
            "linear-gradient(135deg, #05060a 0%, #0a0d16 48%, #05060a 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.035,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "56px 56px",
          transform: `translate3d(${Math.sin(props.time * 0.1) * 5}px, ${Math.cos(props.time * 0.08) * 5}px, 0)`,
        }}
      />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 92px rgba(0,0,0,0.5)" }} />
    </>
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
