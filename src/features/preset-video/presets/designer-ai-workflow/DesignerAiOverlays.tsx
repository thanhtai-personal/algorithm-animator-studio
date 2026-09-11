import { AbsoluteFill } from "remotion";
import { DESIGNER_AI_DURATION_SECONDS, DESIGNER_AI_SEGMENTS } from "./designerAiContent";

export function DesignerAiHud(props: {
  time: number;
  segmentIndex: number;
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
          left: props.portrait ? "7%" : "5.5%",
          right: props.portrait ? "7%" : "4.5%",
          top: props.portrait ? "5%" : "4.8%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          fontSize: props.shortestSide * (props.portrait ? 0.021 : 0.014),
          fontWeight: 900,
          letterSpacing: "0.16em",
        }}
      >
        <span>DESIGNER × AI · 2026</span>
        <span style={{ color: "rgba(255,255,255,0.46)" }}>
          {String(props.segmentIndex + 1).padStart(2, "0")} / {String(DESIGNER_AI_SEGMENTS.length).padStart(2, "0")}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: props.portrait ? "7%" : "5.5%",
          right: props.portrait ? "7%" : "4.5%",
          bottom: props.portrait ? "4.5%" : "4%",
          height: props.portrait ? 8 : 6,
          borderRadius: 99,
          overflow: "hidden",
          background: "rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 99,
            background: `linear-gradient(90deg, ${props.accent}, #f8fafc)`,
            boxShadow: `0 0 24px ${props.accent}`,
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
            `radial-gradient(circle at ${18 + props.progress * 24}% 18%, ${props.accent}2d, transparent 31%)`,
            `radial-gradient(circle at 86% ${70 - props.progress * 18}%, ${props.accent}24, transparent 34%)`,
            "linear-gradient(135deg, #05060a 0%, #0a0d16 48%, #05060a 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.11,
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
          opacity: 0.08 + props.punch * 0.045,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.24) 4px)",
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${120 + props.punch * 60}px rgba(0,0,0,0.72)` }} />
    </>
  );
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
