import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";

type Beat = { id: string; start: number; end: number; eyebrow: string; title: string; body: string; tags?: readonly string[] };

const ACCENT = "#55e6d8";
const FONT = '"Noto Sans", "DejaVu Sans", Arial, sans-serif';

export const GATEWAY_CONTROL_PLANE_DURATION = 53;

const VI_BEATS: readonly Beat[] = [
  { id: "hook", start: 0, end: 7, eyebrow: "CUSTOM GPT × MCP", title: "CHAT → GATEWAY", body: "Model suy nghĩ. Gateway giữ boundary thực thi.", tags: ["RUNTIME TOOLS", "SERVER-SIDE"] },
  { id: "auth", start: 7, end: 15, eyebrow: "SEPARATE AUTHORIZATION", title: "TÁCH QUYỀN KHỎI CHAT", body: "Gateway token authenticate Action. Open ID authorize MCP execution. Provider credential không đi vào GPT context.", tags: ["GATEWAY TOKEN", "OPEN ID", "PROVIDER CREDENTIAL"] },
  { id: "flow", start: 15, end: 25, eyebrow: "CONTROL LAYER", title: "CHATGPT → GATEWAY → MCP", body: "Một protocol ổn định để route intent tới đúng service và tool thay vì hardcode catalog vào prompt.", tags: ["INTENT", "DISCOVERY", "EXECUTION"] },
  { id: "runtime", start: 25, end: 35, eyebrow: "RUNTIME TRUTH", title: "DISCOVER TRƯỚC. CALL SAU.", body: "listMcpServices → listMcpTools → getMcpToolSchema → callMcpTool", tags: ["NO HARDCODE", "SCHEMA-FIRST"] },
  { id: "kit", start: 35, end: 45, eyebrow: "GPT INTEGRATION KIT", title: "GIỮ GPT CONTEXT GỌN", body: "Instructions + Knowledge + OpenAPI + setup guide. Tool catalog runtime vẫn là nguồn đúng.", tags: ["INSTRUCTIONS", "KNOWLEDGE", "OPENAPI"] },
  { id: "cta", start: 45, end: 53, eyebrow: "GPTS MCP GATEWAY", title: "CONTROL PLANE CHO CUSTOM GPT", body: "gpts-mcp.vercel.app", tags: ["CUSTOM GPT", "MCP", "SECURE BOUNDARY"] },
];

const EN_BEATS: readonly Beat[] = [
  { id: "hook", start: 0, end: 7, eyebrow: "CUSTOM GPT × MCP", title: "CHAT → GATEWAY", body: "The model reasons. Gateway owns the execution boundary.", tags: ["RUNTIME TOOLS", "SERVER-SIDE"] },
  { id: "auth", start: 7, end: 15, eyebrow: "SEPARATE AUTHORIZATION", title: "KEEP AUTH OUT OF CHAT", body: "Gateway token authenticates the Action. Open ID authorizes MCP execution. Provider credentials stay outside GPT context.", tags: ["GATEWAY TOKEN", "OPEN ID", "PROVIDER CREDENTIAL"] },
  { id: "flow", start: 15, end: 25, eyebrow: "CONTROL LAYER", title: "CHATGPT → GATEWAY → MCP", body: "One stable protocol routes intent to the right service and tool instead of hardcoding the catalog into prompts.", tags: ["INTENT", "DISCOVERY", "EXECUTION"] },
  { id: "runtime", start: 25, end: 35, eyebrow: "RUNTIME TRUTH", title: "DISCOVER FIRST. CALL SECOND.", body: "listMcpServices → listMcpTools → getMcpToolSchema → callMcpTool", tags: ["NO HARDCODE", "SCHEMA-FIRST"] },
  { id: "kit", start: 35, end: 45, eyebrow: "GPT INTEGRATION KIT", title: "KEEP GPT CONTEXT LEAN", body: "Instructions + Knowledge + OpenAPI + setup guide. Runtime tool catalogs remain authoritative.", tags: ["INSTRUCTIONS", "KNOWLEDGE", "OPENAPI"] },
  { id: "cta", start: 45, end: 53, eyebrow: "GPTS MCP GATEWAY", title: "A CONTROL PLANE FOR CUSTOM GPT", body: "gpts-mcp.vercel.app", tags: ["CUSTOM GPT", "MCP", "SECURE BOUNDARY"] },
];

export function GatewayControlPlaneComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const beats = props.language === "vi" ? VI_BEATS : EN_BEATS;
  const beat = beats.find((item) => time >= item.start && time < item.end) ?? beats[beats.length - 1];
  const localFrame = Math.max(0, frame - Math.round(beat.start * fps));
  const enter = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 115 } });
  const side = Math.min(width, height);
  const portrait = height > width;

  return (
    <AbsoluteFill style={{ background: "#03090d", color: "#f5fbff", fontFamily: FONT, overflow: "hidden" }}>
      <Glow width={width} height={height} time={time} />
      <Grid />
      <div style={{ position: "absolute", inset: portrait ? "4.8% 6.5% 5.5%" : "6% 7%", display: "grid", gridTemplateRows: "auto 1fr auto", gap: portrait ? 30 : 24 }}>
        <Header side={side} />
        <main style={{ display: "grid", alignItems: "center", gap: portrait ? 44 : 64, gridTemplateColumns: portrait ? "1fr" : "1.05fr .95fr" }}>
          <section style={{ opacity: interpolate(enter, [0, 1], [0, 1]), translate: `0 ${interpolate(enter, [0, 1], [34, 0])}px` }}>
            <div style={{ color: ACCENT, fontSize: side * (portrait ? 0.028 : 0.021), fontWeight: 900, letterSpacing: "0.13em", marginBottom: 18 }}>{beat.eyebrow}</div>
            <div style={{ maxWidth: 920, fontSize: side * (portrait ? 0.078 : 0.064), lineHeight: 0.98, letterSpacing: "-0.045em", fontWeight: 950 }}>{beat.title}</div>
            <div style={{ maxWidth: 850, marginTop: 24, color: "rgba(241,250,255,.67)", fontSize: side * (portrait ? 0.032 : 0.025), lineHeight: 1.34, fontWeight: 650 }}>{beat.body}</div>
            <TagRow tags={beat.tags ?? []} side={side} />
          </section>
          <Visual beatId={beat.id} side={side} portrait={portrait} time={time} language={props.language} />
        </main>
        <Footer time={time} duration={props.durationSeconds} side={side} />
      </div>
    </AbsoluteFill>
  );
}

function Header({ side }: { side: number }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: side * 0.018, fontWeight: 900, letterSpacing: "0.08em", color: "rgba(255,255,255,.58)" }}><span><span style={{ color: ACCENT }}>●</span> GPTS MCP GATEWAY</span><span>CONTROL PLANE</span></div>;
}

function TagRow({ tags, side }: { tags: readonly string[]; side: number }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 26 }}>{tags.map((tag) => <span key={tag} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(85,230,216,.28)", background: "rgba(85,230,216,.06)", color: ACCENT, fontSize: side * 0.017, fontWeight: 900, letterSpacing: "0.05em" }}>{tag}</span>)}</div>;
}

function Visual({ beatId, side, portrait, time, language }: { beatId: string; side: number; portrait: boolean; time: number; language: "en" | "vi" }) {
  if (beatId === "auth") return <AuthCards side={side} portrait={portrait} />;
  if (beatId === "runtime") return <RuntimeFlow side={side} />;
  if (beatId === "kit") return <KitCards side={side} />;
  return <ControlFlow side={side} portrait={portrait} time={time} language={language} emphasizeGateway={beatId === "flow" || beatId === "cta"} />;
}

function ControlFlow({ side, portrait, time, language, emphasizeGateway }: { side: number; portrait: boolean; time: number; language: "en" | "vi"; emphasizeGateway: boolean }) {
  const items = [
    ["01 · AI", "ChatGPT", language === "vi" ? "Reasoning + intent" : "Reasoning + intent"],
    ["02 · CONTROL", "MCP Gateway", language === "vi" ? "Auth + discovery + routing" : "Auth + discovery + routing"],
    ["03 · PROVIDER", "MCP Service", language === "vi" ? "Runtime tools" : "Runtime tools"],
  ];
  return <div style={{ display: "grid", gridTemplateColumns: portrait ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>{items.map(([eyebrow, title, body], index) => <div key={title} style={{ minHeight: portrait ? 140 : 200, padding: 20, border: index === 1 && emphasizeGateway ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,.12)", background: index === 1 ? "rgba(85,230,216,.07)" : "rgba(4,14,20,.84)", boxShadow: index === 1 ? `0 0 ${40 + Math.sin(time * 2) * 8}px rgba(85,230,216,.12)` : "none" }}><div style={{ color: index === 1 ? ACCENT : "rgba(255,255,255,.42)", fontSize: side * 0.015, fontWeight: 900, letterSpacing: "0.09em" }}>{eyebrow}</div><div style={{ marginTop: 20, fontSize: side * 0.033, fontWeight: 950 }}>{title}</div><div style={{ marginTop: 12, color: "rgba(255,255,255,.55)", fontSize: side * 0.019, lineHeight: 1.3 }}>{body}</div></div>)}</div>;
}

function AuthCards({ side, portrait }: { side: number; portrait: boolean }) {
  const items = [["CHAT / ACTION", "Gateway token", "Authenticate request"], ["ENTITLEMENT", "Open ID", "Authorize execution"], ["SERVER ONLY", "Provider credential", "Encrypted backend secret"]];
  return <div style={{ display: "grid", gridTemplateColumns: portrait ? "1fr" : "repeat(3,1fr)", gap: 12 }}>{items.map(([eyebrow, title, body], index) => <div key={title} style={{ padding: 22, border: `1px solid ${index === 2 ? "rgba(255,255,255,.12)" : "rgba(85,230,216,.3)"}`, background: index === 2 ? "rgba(255,255,255,.035)" : "rgba(85,230,216,.055)" }}><div style={{ color: index === 2 ? "rgba(255,255,255,.42)" : ACCENT, fontSize: side * 0.015, fontWeight: 900 }}>{eyebrow}</div><div style={{ marginTop: 14, fontSize: side * 0.029, fontWeight: 950 }}>{title}</div><div style={{ marginTop: 8, color: "rgba(255,255,255,.58)", fontSize: side * 0.018 }}>{body}</div></div>)}</div>;
}

function RuntimeFlow({ side }: { side: number }) {
  const rows = ["listMcpServices", "listMcpTools", "getMcpToolSchema", "callMcpTool"];
  return <div style={{ border: "1px solid rgba(85,230,216,.24)", background: "rgba(3,13,18,.88)", padding: 20 }}>{rows.map((row, index) => <div key={row} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "15px 16px", marginTop: index ? 10 : 0, border: `1px solid ${index === rows.length - 1 ? "rgba(85,230,216,.42)" : "rgba(255,255,255,.08)"}`, background: index === rows.length - 1 ? "rgba(85,230,216,.08)" : "rgba(255,255,255,.025)", fontSize: side * 0.019, fontWeight: 850 }}><span>{String(index + 1).padStart(2, "0")} · {row}</span><span style={{ color: ACCENT }}>runtime</span></div>)}</div>;
}

function KitCards({ side }: { side: number }) {
  const items = [["instructions.md", "Intent + routing rules"], ["Knowledge.md", "Stable concepts"], ["openapi.yaml", "Gateway Action contract"], ["setup-guide.md", "Configure Custom GPT"]];
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{items.map(([name, body]) => <div key={name} style={{ minHeight: 130, padding: 20, border: "1px solid rgba(255,255,255,.1)", background: "rgba(6,16,22,.82)" }}><div style={{ color: ACCENT, fontWeight: 950, fontSize: side * 0.023 }}>{name}</div><div style={{ marginTop: 10, color: "rgba(255,255,255,.56)", fontSize: side * 0.017 }}>{body}</div></div>)}</div>;
}

function Footer({ time, duration, side }: { time: number; duration: number; side: number }) {
  return <div><div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.34)", fontSize: side * 0.014, marginBottom: 10 }}><span>gpts-mcp.vercel.app</span><span>{Math.min(100, Math.round(time / duration * 100))}%</span></div><div style={{ height: 4, background: "rgba(255,255,255,.08)" }}><div style={{ height: "100%", width: `${Math.min(100, time / duration * 100)}%`, background: ACCENT }} /></div></div>;
}

function Glow({ width, height, time }: { width: number; height: number; time: number }) {
  return <div style={{ position: "absolute", width: Math.min(width, height) * 0.9, height: Math.min(width, height) * 0.9, borderRadius: "50%", left: width * 0.4 + Math.sin(time * 0.25) * 40, top: height * 0.15, background: ACCENT, filter: "blur(190px)", opacity: 0.09 }} />;
}

function Grid() {
  return <div style={{ position: "absolute", inset: 0, opacity: 0.22, backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(to bottom, black, transparent 94%)" }} />;
}

export const GATEWAY_CONTROL_PLANE_BEATS = { vi: VI_BEATS, en: EN_BEATS } as const;
