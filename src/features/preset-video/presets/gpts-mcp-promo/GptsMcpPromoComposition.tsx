import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps, PresetVideoEditableLyricCue } from "../../types";
import type { GptsMcpPromoBeat, GptsMcpPromoVariant } from "./gptsMcpPromoContent";

type Props = PresetVideoCompositionProps & {
  variant: GptsMcpPromoVariant;
  beats: readonly GptsMcpPromoBeat[];
  lyrics: readonly PresetVideoEditableLyricCue[];
};

const ACCENTS: Record<GptsMcpPromoVariant, string> = {
  "token-fallback": "#ffb020",
  "mobile-workflow": "#5eead4",
  "secure-gateway": "#8b5cf6",
};

export function GptsMcpPromoComposition(props: Props) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const portrait = props.aspectRatio === "9:16";
  const beat = props.beats.find((item) => time >= item.start && time < item.end) ?? props.beats[props.beats.length - 1];
  const beatFrame = Math.max(0, frame - Math.round(beat.start * fps));
  const enter = spring({ frame: beatFrame, fps, config: { damping: 18, stiffness: 120 } });
  const accent = ACCENTS[props.variant];
  const lyric = getActiveLyric(props.lyrics, props.lyricTimings, time);
  const side = Math.min(width, height);

  return (
    <AbsoluteFill style={{ background: "#05070b", color: "#f8fafc", fontFamily: "Inter, Arial, sans-serif", overflow: "hidden" }}>
      <Ambient accent={accent} time={time} width={width} height={height} />
      <div style={{ position: "absolute", inset: portrait ? "6% 7% 9%" : "7% 7% 9%", display: "grid", gridTemplateRows: "auto 1fr auto", gap: portrait ? 28 : 24 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, fontSize: side * 0.021, letterSpacing: "0.12em", fontWeight: 800, color: "rgba(255,255,255,.68)" }}>
          <span>GPTS MCP GATEWAY</span><span style={{ color: accent }}>CONTROL PLANE</span>
        </header>

        <main style={{ display: "grid", gridTemplateColumns: portrait ? "1fr" : "1.05fr .95fr", alignItems: "center", gap: portrait ? 38 : 70 }}>
          <section style={{ opacity: interpolate(enter, [0, 1], [0, 1]), translate: `0 ${interpolate(enter, [0, 1], [34, 0])}px` }}>
            <div style={{ color: accent, fontSize: side * (portrait ? 0.026 : 0.021), fontWeight: 900, letterSpacing: "0.14em", marginBottom: 18 }}>{beat.eyebrow}</div>
            <div style={{ fontSize: side * (portrait ? 0.082 : 0.067), fontWeight: 950, lineHeight: 0.98, letterSpacing: "-0.045em", maxWidth: portrait ? "100%" : 820 }}>{beat.title}</div>
            <div style={{ marginTop: 24, maxWidth: 760, color: "rgba(248,250,252,.72)", fontSize: side * (portrait ? 0.036 : 0.028), lineHeight: 1.25, fontWeight: 650 }}>{beat.body}</div>
            {beat.metric ? <div style={{ display: "inline-flex", marginTop: 28, padding: "12px 18px", borderRadius: 999, border: `1px solid ${accent}66`, background: `${accent}12`, color: accent, fontWeight: 900, fontSize: side * 0.023, letterSpacing: "0.08em" }}>{beat.metric}</div> : null}
          </section>

          <ProductStage variant={props.variant} accent={accent} time={time} beatId={beat.id} portrait={portrait} side={side} />
        </main>

        <footer>
          {lyric ? <div style={{ margin: "0 auto 18px", maxWidth: portrait ? 900 : 1200, textAlign: "center", fontSize: side * (portrait ? 0.038 : 0.026), fontWeight: 850, lineHeight: 1.2, textShadow: "0 5px 24px rgba(0,0,0,.85)" }}>{lyric.lines.map((line) => <div key={line}>{line}</div>)}</div> : null}
          <div style={{ height: 5, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,.12)" }}><div style={{ width: `${Math.min(100, time / props.durationSeconds * 100)}%`, height: "100%", background: accent }} /></div>
        </footer>
      </div>
    </AbsoluteFill>
  );
}

function ProductStage({ variant, accent, time, beatId, portrait, side }: { variant: GptsMcpPromoVariant; accent: string; time: number; beatId: string; portrait: boolean; side: number }) {
  const cardStyle = { border: "1px solid rgba(255,255,255,.12)", background: "rgba(10,14,22,.82)", boxShadow: "0 30px 90px rgba(0,0,0,.35)", backdropFilter: "blur(18px)" } as const;
  if (variant === "mobile-workflow") {
    return <div style={{ display: "flex", justifyContent: "center" }}><div style={{ ...cardStyle, width: portrait ? "72%" : "64%", minHeight: portrait ? 570 : 500, borderRadius: 48, padding: 24, transform: `rotate(${Math.sin(time * 0.6) * 1.2}deg)` }}><div style={{ width: 120, height: 18, borderRadius: 999, margin: "0 auto 24px", background: "rgba(255,255,255,.12)" }} /><ChatBubble align="right" accent={accent}>Fix tiếp feature này giúp mình.</ChatBubble><ChatBubble align="left" accent={accent}>Discovering MCP tools…</ChatBubble><FlowRows accent={accent} compact /><div style={{ marginTop: 24, padding: 18, borderRadius: 20, background: `${accent}14`, border: `1px solid ${accent}55`, fontSize: side * 0.023, fontWeight: 900, color: accent }}>✓ Tool invocation complete</div></div></div>;
  }
  if (variant === "token-fallback") {
    return <div style={{ ...cardStyle, borderRadius: 30, padding: portrait ? 24 : 30 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><strong style={{ fontSize: side * 0.027 }}>AI Coding Session</strong><span style={{ color: beatId === "hook" ? "#fb7185" : accent, fontWeight: 900 }}>{beatId === "hook" ? "TOKEN LIMIT" : "GATEWAY ACTIVE"}</span></div><div style={{ height: 12, borderRadius: 999, background: "rgba(255,255,255,.1)", overflow: "hidden", marginBottom: 24 }}><div style={{ width: beatId === "hook" ? "98%" : "38%", height: "100%", background: beatId === "hook" ? "#fb7185" : accent }} /></div><FlowRows accent={accent} /><div style={{ marginTop: 26, fontSize: side * 0.022, color: "rgba(255,255,255,.58)" }}>Custom GPT → Gateway → MCP provider</div></div>;
  }
  return <div style={{ ...cardStyle, borderRadius: 30, padding: portrait ? 24 : 30 }}><div style={{ fontSize: side * 0.024, color: accent, fontWeight: 950, marginBottom: 22 }}>LIVE MCP ROUTER</div><FlowRows accent={accent} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 }}><Stat label="Credential" value="Gateway held" /><Stat label="Entitlement" value="Open ID" /><Stat label="Tool catalog" value="Runtime" /><Stat label="GPT context" value="Clean" /></div></div>;
}

function FlowRows({ accent, compact = false }: { accent: string; compact?: boolean }) {
  const rows = ["listMcpServices", "listMcpTools", "getMcpToolSchema", "callMcpTool"];
  return <div style={{ display: "grid", gap: compact ? 8 : 12 }}>{rows.map((row, index) => <div key={row} style={{ display: "flex", justifyContent: "space-between", gap: 18, padding: compact ? "11px 13px" : "14px 16px", borderRadius: 14, background: index === rows.length - 1 ? `${accent}16` : "rgba(255,255,255,.045)", border: `1px solid ${index === rows.length - 1 ? `${accent}55` : "rgba(255,255,255,.08)"}`, fontWeight: 800 }}><span>{String(index + 1).padStart(2, "0")} · {row}</span><span style={{ color: accent }}>200</span></div>)}</div>;
}

function ChatBubble({ children, align, accent }: { children: string; align: "left" | "right"; accent: string }) {
  return <div style={{ maxWidth: "86%", margin: align === "right" ? "0 0 18px auto" : "0 auto 18px 0", padding: "15px 18px", borderRadius: 20, background: align === "right" ? accent : "rgba(255,255,255,.08)", color: align === "right" ? "#071014" : "white", fontWeight: 800 }}>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,.045)" }}><div style={{ fontSize: 13, color: "rgba(255,255,255,.48)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ marginTop: 5, fontWeight: 900 }}>{value}</div></div>;
}

function Ambient({ accent, time, width, height }: { accent: string; time: number; width: number; height: number }) {
  return <><div style={{ position: "absolute", width: Math.min(width, height) * 0.85, height: Math.min(width, height) * 0.85, borderRadius: "50%", left: width * 0.52 + Math.sin(time * 0.35) * 30, top: height * 0.1, background: accent, filter: "blur(160px)", opacity: 0.12 }} /><div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "linear-gradient(to bottom, black, transparent 92%)" }} /></>;
}

function getActiveLyric(lyrics: readonly PresetVideoEditableLyricCue[], overrides: PresetVideoCompositionProps["lyricTimings"], time: number) {
  return lyrics.find((cue) => { const timing = overrides[cue.id] ?? cue; return time >= timing.start && time < timing.end; });
}
