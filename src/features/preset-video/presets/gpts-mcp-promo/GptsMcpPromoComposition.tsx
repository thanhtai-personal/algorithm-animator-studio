import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps, PresetVideoEditableLyricCue } from "../../types";
import type { GptsMcpPromoBeat, GptsMcpPromoVariant } from "./gptsMcpPromoContent";

type Props = PresetVideoCompositionProps & { variant: GptsMcpPromoVariant; beats: readonly GptsMcpPromoBeat[]; lyrics: readonly PresetVideoEditableLyricCue[] };
const ACCENTS: Record<GptsMcpPromoVariant, string> = { "token-fallback": "#ffb020", "mobile-workflow": "#5eead4", "secure-gateway": "#8b5cf6" };
const UI_FONT = '"Noto Sans", "DejaVu Sans", Arial, sans-serif';

export function GptsMcpPromoComposition(props: Props) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const portrait = props.aspectRatio === "9:16";
  const beat = props.beats.find((item) => time >= item.start && time < item.end) ?? props.beats[props.beats.length - 1];
  const beatFrame = Math.max(0, frame - Math.round(beat.start * fps));
  const enter = spring({ frame: beatFrame, fps, config: { damping: 18, stiffness: 120 } });
  const accent = ACCENTS[props.variant];
  const side = Math.min(width, height);
  const isTokenHook = props.variant === "token-fallback" && beat.id === "hook";

  return <AbsoluteFill style={{ background: "#05070b", color: "#f8fafc", fontFamily: UI_FONT, overflow: "hidden" }}>
    <Ambient accent={accent} time={time} width={width} height={height} />
    <div style={{ position: "absolute", inset: portrait ? "6% 7% 9%" : "7% 7% 9%", display: "grid", gridTemplateRows: "auto 1fr auto", gap: portrait ? 28 : 24 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, fontSize: side * 0.021, letterSpacing: "0.08em", fontWeight: 800, color: "rgba(255,255,255,.68)" }}><span>GPTS MCP GATEWAY</span><span style={{ color: accent }}>CONTROL PLANE</span></header>
      {isTokenHook ? <TokenHook time={time} accent={accent} portrait={portrait} side={side} beat={beat} language={props.language} /> : <main style={{ display: "grid", gridTemplateColumns: portrait ? "1fr" : "1.05fr .95fr", alignItems: "center", gap: portrait ? 38 : 70 }}>
        <section style={{ opacity: interpolate(enter, [0, 1], [0, 1]), translate: `0 ${interpolate(enter, [0, 1], [34, 0])}px` }}>
          <div style={{ color: accent, fontSize: side * (portrait ? 0.026 : 0.021), fontWeight: 900, letterSpacing: "0.1em", marginBottom: 18 }}>{beat.eyebrow}</div>
          <div style={{ fontSize: side * (portrait ? 0.078 : 0.063), fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em", maxWidth: portrait ? "100%" : 820 }}>{beat.title}</div>
          <div style={{ marginTop: 24, maxWidth: 760, color: "rgba(248,250,252,.72)", fontSize: side * (portrait ? 0.034 : 0.027), lineHeight: 1.28, fontWeight: 650 }}>{beat.body}</div>
          {beat.metric ? <div style={{ display: "inline-flex", marginTop: 28, padding: "12px 18px", borderRadius: 999, border: `1px solid ${accent}66`, background: `${accent}12`, color: accent, fontWeight: 900, fontSize: side * 0.023, letterSpacing: "0.06em" }}>{beat.metric}</div> : null}
        </section>
        <ProductStage variant={props.variant} accent={accent} time={time} portrait={portrait} side={side} language={props.language} />
      </main>}
      <footer><div style={{ height: 5, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,.12)" }}><div style={{ width: `${Math.min(100, time / props.durationSeconds * 100)}%`, height: "100%", background: accent }} /></div></footer>
    </div>
  </AbsoluteFill>;
}

function TokenHook({ time, accent, portrait, side, beat, language }: { time: number; accent: string; portrait: boolean; side: number; beat: GptsMcpPromoBeat; language: "en" | "vi" }) {
  const alertPhase = Math.min(1, time / 2.3);
  const questionPhase = Math.max(0, Math.min(1, (time - 2.1) / 1.2));
  return <main style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
    <div style={{ position: "absolute", width: portrait ? "92%" : "68%", padding: portrait ? 26 : 34, borderRadius: 28, background: "rgba(18,12,18,.94)", border: "1px solid rgba(251,113,133,.55)", boxShadow: "0 40px 120px rgba(0,0,0,.5)", scale: interpolate(alertPhase, [0, 1], [0.72, 1.28]), opacity: interpolate(questionPhase, [0, 1], [1, 0.22]) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 22 }}><strong style={{ fontSize: side * 0.03 }}>AI Coding Session</strong><span style={{ color: "#fb7185", fontWeight: 900, fontSize: side * 0.024 }}>TOKEN LIMIT</span></div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,.09)", overflow: "hidden" }}><div style={{ width: `${Math.max(0, 100 - time * 28)}%`, height: "100%", background: "#fb7185" }} /></div>
      <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.55)", fontSize: side * 0.02 }}><span>Codex session</span><span>quota exhausted</span></div>
    </div>
    <div style={{ textAlign: "center", opacity: questionPhase, scale: interpolate(questionPhase, [0, 1], [0.72, 1]), zIndex: 2 }}>
      <div style={{ color: "#fb7185", fontSize: side * (portrait ? 0.035 : 0.03), fontWeight: 900, letterSpacing: "0.08em" }}>{beat.title.replace("?", "")}</div>
      <div style={{ marginTop: 12, maxWidth: portrait ? 820 : 980, fontSize: side * (portrait ? 0.09 : 0.078), fontWeight: 950, lineHeight: 0.98, letterSpacing: "-0.045em" }}>{beat.body}</div>
      <div style={{ marginTop: 24, display: "inline-flex", padding: "10px 16px", borderRadius: 999, border: `1px solid ${accent}66`, color: accent, fontWeight: 900 }}>{language === "vi" ? "ĐỪNG DỪNG WORKFLOW" : "KEEP THE WORKFLOW MOVING"}</div>
    </div>
  </main>;
}

function ProductStage({ variant, accent, time, portrait, side, language }: { variant: GptsMcpPromoVariant; accent: string; time: number; portrait: boolean; side: number; language: "en" | "vi" }) {
  const cardStyle = { border: "1px solid rgba(255,255,255,.12)", background: "rgba(10,14,22,.82)", boxShadow: "0 30px 90px rgba(0,0,0,.35)", backdropFilter: "blur(18px)" } as const;
  if (variant === "mobile-workflow") return <div style={{ display: "flex", justifyContent: "center" }}><div style={{ ...cardStyle, width: portrait ? "72%" : "64%", minHeight: portrait ? 570 : 500, borderRadius: 48, padding: 24, transform: `rotate(${Math.sin(time * 0.6) * 1.2}deg)` }}><div style={{ width: 120, height: 18, borderRadius: 999, margin: "0 auto 24px", background: "rgba(255,255,255,.12)" }} /><ChatBubble align="right" accent={accent}>{language === "vi" ? "Fix tiếp feature này giúp mình." : "Keep working on this feature for me."}</ChatBubble><ChatBubble align="left" accent={accent}>Discovering MCP tools…</ChatBubble><FlowRows accent={accent} compact /><div style={{ marginTop: 24, padding: 18, borderRadius: 20, background: `${accent}14`, border: `1px solid ${accent}55`, fontSize: side * 0.023, fontWeight: 900, color: accent }}>✓ Tool invocation complete</div></div></div>;
  if (variant === "token-fallback") return <div style={{ ...cardStyle, borderRadius: 30, padding: portrait ? 24 : 30 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><strong style={{ fontSize: side * 0.027 }}>AI Coding Session</strong><span style={{ color: accent, fontWeight: 900 }}>GATEWAY ACTIVE</span></div><FlowRows accent={accent} /><div style={{ marginTop: 26, fontSize: side * 0.022, color: "rgba(255,255,255,.58)" }}>Custom GPT → Gateway → MCP provider</div></div>;
  return <div style={{ ...cardStyle, borderRadius: 30, padding: portrait ? 24 : 30 }}><div style={{ fontSize: side * 0.024, color: accent, fontWeight: 950, marginBottom: 22 }}>LIVE MCP ROUTER</div><FlowRows accent={accent} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 }}><Stat label="Credential" value="Gateway held" /><Stat label="Entitlement" value="Open ID" /><Stat label="Tool catalog" value="Runtime" /><Stat label="GPT context" value="Clean" /></div></div>;
}

function FlowRows({ accent, compact = false }: { accent: string; compact?: boolean }) { const rows = ["listMcpServices", "listMcpTools", "getMcpToolSchema", "callMcpTool"]; return <div style={{ display: "grid", gap: compact ? 8 : 12 }}>{rows.map((row, index) => <div key={row} style={{ display: "flex", justifyContent: "space-between", gap: 18, padding: compact ? "11px 13px" : "14px 16px", borderRadius: 14, background: index === rows.length - 1 ? `${accent}16` : "rgba(255,255,255,.045)", border: `1px solid ${index === rows.length - 1 ? `${accent}55` : "rgba(255,255,255,.08)"}`, fontWeight: 800 }}><span>{String(index + 1).padStart(2, "0")} · {row}</span><span style={{ color: accent }}>200</span></div>)}</div>; }
function ChatBubble({ children, align, accent }: { children: string; align: "left" | "right"; accent: string }) { return <div style={{ maxWidth: "86%", margin: align === "right" ? "0 0 18px auto" : "0 auto 18px 0", padding: "15px 18px", borderRadius: 20, background: align === "right" ? accent : "rgba(255,255,255,.08)", color: align === "right" ? "#071014" : "white", fontWeight: 800 }}>{children}</div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,.045)" }}><div style={{ fontSize: 13, color: "rgba(255,255,255,.48)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ marginTop: 5, fontWeight: 900 }}>{value}</div></div>; }
function Ambient({ accent, time, width, height }: { accent: string; time: number; width: number; height: number }) { return <><div style={{ position: "absolute", width: Math.min(width, height) * 0.85, height: Math.min(width, height) * 0.85, borderRadius: "50%", left: width * 0.52 + Math.sin(time * 0.35) * 30, top: height * 0.1, background: accent, filter: "blur(160px)", opacity: 0.12 }} /><div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(to bottom, black, transparent 92%)" }} /></>; }
