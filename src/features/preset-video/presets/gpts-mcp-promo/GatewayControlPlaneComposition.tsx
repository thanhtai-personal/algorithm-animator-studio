import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { GatewayControlPlaneEvidence } from "./GatewayControlPlaneEvidence";
import { GATEWAY_CONTROL_PLANE_BEATS, GATEWAY_CONTROL_PLANE_DURATION } from "./gatewayControlPlaneContent";
import "./gatewayControlPlaneFont.css";

const ACCENT = "#55e6d8";
const FONT = '"Be Vietnam Pro", Arial, sans-serif';

export function GatewayControlPlaneComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const portrait = height > width;
  const side = Math.min(width, height);
  const beats = GATEWAY_CONTROL_PLANE_BEATS[props.language];
  const matchingBeatIndex = beats.findIndex((item) => time >= item.start && time < item.end);
  const beatIndex = matchingBeatIndex < 0 ? beats.length - 1 : matchingBeatIndex;
  const beat = beats[beatIndex] ?? beats[beats.length - 1];
  const localFrame = Math.max(0, frame - Math.round(beat.start * fps));
  const entrance = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 125 } });
  const tone = beat.id === "hook" ? "#ffad63" : ACCENT;

  return <AbsoluteFill style={{ background: "#03090d", color: "#f5fbff", fontFamily: FONT, overflow: "hidden" }}>
    <div style={{ position: "absolute", width: side * 0.85, height: side * 0.85, borderRadius: "50%", left: width * 0.4, top: height * 0.15, background: tone, filter: "blur(190px)", opacity: 0.08 }} />
    <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(to bottom, black, transparent 94%)" }} />

    <div style={{ position: "absolute", inset: portrait ? "5% 6.5% 5.2%" : "6% 6.5%", display: "grid", gridTemplateRows: "auto minmax(0, 1fr) auto", gap: portrait ? 28 : 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, color: "rgba(255,255,255,.62)", fontSize: side * (portrait ? 0.018 : 0.016), fontWeight: 700, letterSpacing: ".07em" }}>
        <span><span style={{ color: tone }}>●</span> GPTS MCP GATEWAY</span>
        <span>{String(beatIndex + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")}</span>
      </header>

      <main style={{ display: "flex", flexDirection: portrait ? "column" : "row", justifyContent: "center", alignItems: "center", gap: portrait ? 34 : 56, minHeight: 0 }}>
        <section style={{ width: portrait ? "100%" : "44%", flexShrink: 0, opacity: interpolate(entrance, [0, 1], [0, 1]), transform: `translateY(${interpolate(entrance, [0, 1], [28, 0])}px)` }}>
          <div style={{ color: tone, fontSize: side * (portrait ? 0.023 : 0.019), fontWeight: 700, letterSpacing: ".11em", marginBottom: portrait ? 22 : 16 }}>{beat.eyebrow}</div>
          <div style={{ fontSize: side * (portrait ? (beat.id === "hook" ? 0.087 : 0.071) : 0.06), lineHeight: 1.12, letterSpacing: "-.018em", fontWeight: 800, overflowWrap: "anywhere" }}>{beat.title}</div>
          <div style={{ maxWidth: 880, marginTop: portrait ? 24 : 20, color: "rgba(241,250,255,.7)", fontSize: side * (portrait ? 0.029 : 0.022), lineHeight: 1.48, fontWeight: 500 }}>{beat.body}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: portrait ? 26 : 21 }}>{beat.tags.map((tag) => <span key={tag} style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${tone}55`, background: `${tone}12`, color: tone, fontSize: side * (portrait ? 0.016 : 0.014), fontWeight: 700, letterSpacing: ".04em" }}>{tag}</span>)}</div>
        </section>
        <div style={{ width: portrait ? "100%" : "56%", maxWidth: portrait ? 940 : undefined, opacity: interpolate(entrance, [0, 1], [0, 1]), transform: `scale(${interpolate(entrance, [0, 1], [0.975, 1])})` }}>
          <GatewayControlPlaneEvidence beat={beat} fps={fps} side={side} portrait={portrait} language={props.language} />
        </div>
      </main>

      <footer style={{ color: "rgba(255,255,255,.38)", fontSize: side * (portrait ? 0.015 : 0.013) }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 11 }}><span>gpts-mcp.vercel.app</span><span>{Math.min(100, Math.round(time / GATEWAY_CONTROL_PLANE_DURATION * 100))}%</span></div>
        <div style={{ height: 4, background: "rgba(255,255,255,.08)" }}><div style={{ width: `${Math.min(100, time / GATEWAY_CONTROL_PLANE_DURATION * 100)}%`, height: "100%", background: tone }} /></div>
      </footer>
    </div>
  </AbsoluteFill>;
}
