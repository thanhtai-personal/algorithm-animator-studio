import { Video } from "@remotion/media";
import { Img, Sequence, staticFile } from "remotion";
import type { GatewayBeat } from "./gatewayControlPlaneContent";
import { GATEWAY_MEDIA_ROOT } from "./gatewayControlPlaneContent";

const ACCENT = "#55e6d8";
const MEDIA: Partial<Record<GatewayBeat["id"], string>> = {
  gateway: "gateway-intro.mp4",
  action: "gpt-action.mp4",
  runtime: "gateway-services.mp4",
  continue: "gpt-conversation.mp4",
};

export const GATEWAY_EVIDENCE_FILES = ["codex-token-limit.png", ...Object.values(MEDIA)] as const;

export function GatewayControlPlaneEvidence(props: {
  beat: GatewayBeat;
  fps: number;
  side: number;
  portrait: boolean;
  language: "vi" | "en";
}) {
  const { beat, fps, side, portrait, language } = props;
  if (beat.id === "switch") return <SwitchFlow side={side} portrait={portrait} language={language} />;
  if (beat.id === "cta") return <CallToAction side={side} portrait={portrait} language={language} />;

  const file = MEDIA[beat.id];
  return (
    <div style={{ width: "100%", maxWidth: portrait ? 940 : 920, margin: "0 auto", border: "1px solid rgba(85,230,216,.27)", borderRadius: 24, overflow: "hidden", background: "rgba(7,16,23,.9)", boxShadow: "0 30px 100px rgba(0,0,0,.3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: portrait ? "18px 22px" : "14px 18px", borderBottom: "1px solid rgba(255,255,255,.1)", fontSize: side * (portrait ? 0.018 : 0.014), fontWeight: 700, letterSpacing: ".05em", color: ACCENT }}>
        <span>{beat.mediaLabel}</span><span style={{ color: "rgba(255,255,255,.38)" }}>● SOURCE MEDIA</span>
      </div>
      <div style={{ height: portrait ? side * (beat.id === "hook" ? 0.68 : 0.53) : side * 0.43, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#05090e" }}>
        {beat.id === "hook" ? (
          <Img src={staticFile(`${GATEWAY_MEDIA_ROOT}/codex-token-limit.png`)} style={{ display: "block", height: "100%", maxWidth: "100%", objectFit: "contain" }} />
        ) : file ? (
          <Sequence from={Math.round(beat.start * fps)} durationInFrames={Math.round((beat.end - beat.start) * fps)} layout="none">
            <Video src={staticFile(`${GATEWAY_MEDIA_ROOT}/${file}`)} muted style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
          </Sequence>
        ) : null}
      </div>
      <div style={{ padding: portrait ? "17px 22px 20px" : "13px 18px", borderTop: "1px solid rgba(255,255,255,.07)", color: "rgba(241,250,255,.53)", fontSize: side * (portrait ? 0.019 : 0.015), fontWeight: 500 }}>{beat.mediaCaption}</div>
    </div>
  );
}

function SwitchFlow({ side, portrait, language }: { side: number; portrait: boolean; language: "vi" | "en" }) {
  const nodes = language === "vi"
    ? [["01", "Custom GPT", "Nhận mục tiêu từ bạn"], ["02", "MCP Gateway", "Xác thực · tìm tool · route"], ["03", "MCP Provider", "Thực thi phía server"]]
    : [["01", "Custom GPT", "Receives your goal"], ["02", "MCP Gateway", "Auth · discovery · routing"], ["03", "MCP Provider", "Executes server-side"]];
  return <div style={{ display: "grid", gridTemplateColumns: portrait ? "1fr" : "repeat(3, 1fr)", gap: 12, width: "100%", maxWidth: 940, margin: "0 auto" }}>
    {nodes.map(([number, title, detail], index) => <div key={number} style={{ minHeight: portrait ? 150 : 200, padding: portrait ? 28 : 20, border: `1px solid ${index === 1 ? ACCENT : "rgba(255,255,255,.14)"}`, borderRadius: 20, background: index === 1 ? "rgba(85,230,216,.09)" : "rgba(7,16,23,.86)", boxShadow: index === 1 ? "0 0 60px rgba(85,230,216,.1)" : "none" }}>
      <div style={{ color: ACCENT, fontSize: side * 0.017, fontWeight: 700, letterSpacing: ".08em" }}>{number} / {index === 1 ? "CONTROL" : "FLOW"}</div>
      <div style={{ marginTop: 16, fontSize: side * (portrait ? 0.036 : 0.028), fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 9, color: "rgba(241,250,255,.58)", fontSize: side * (portrait ? 0.022 : 0.017) }}>{detail}</div>
    </div>)}
  </div>;
}

function CallToAction({ side, portrait, language }: { side: number; portrait: boolean; language: "vi" | "en" }) {
  return <div style={{ width: "100%", maxWidth: 940, margin: "0 auto", padding: portrait ? "56px 42px" : "36px", border: "1px solid rgba(85,230,216,.45)", borderRadius: 26, background: "linear-gradient(135deg, rgba(85,230,216,.16), rgba(7,16,23,.88) 58%)", boxShadow: "0 0 90px rgba(85,230,216,.12)" }}>
    <div style={{ color: ACCENT, fontSize: side * 0.018, fontWeight: 700, letterSpacing: ".1em" }}>CUSTOM GPT × MCP GATEWAY</div>
    <div style={{ marginTop: 24, fontSize: side * (portrait ? 0.056 : 0.045), lineHeight: 1.14, fontWeight: 800 }}>{language === "vi" ? "TỪ CHAT ĐẾN TOOL THẬT." : "FROM CHAT TO REAL TOOLS."}</div>
    <div style={{ marginTop: 30, padding: "18px 22px", width: "fit-content", maxWidth: "100%", borderRadius: 12, background: ACCENT, color: "#031012", fontSize: side * (portrait ? 0.028 : 0.022), fontWeight: 800 }}>gpts-mcp.vercel.app ↗</div>
    <div style={{ marginTop: 20, color: "rgba(241,250,255,.6)", fontSize: side * (portrait ? 0.022 : 0.017) }}>{language === "vi" ? "Integration Kit miễn phí · Dùng thử 7 ngày" : "Free Integration Kit · 7-day trial"}</div>
  </div>;
}
