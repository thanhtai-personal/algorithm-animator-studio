import { AbsoluteFill, Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_REMOTION_VIDEO, normalizeRemotionVideoInput, type RemotionVideoInputProps } from "../lib/remotionVideoTypes";

export function AlgorithmExplainerComposition(rawProps: Partial<RemotionVideoInputProps>) {
  const props = normalizeRemotionVideoInput({ ...DEFAULT_REMOTION_VIDEO, ...rawProps });
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const introOpacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const outroOpacity = interpolate(frame, [durationInFrames - 45, durationInFrames - 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isPortrait = height > width;
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames - 1)));
  const accent = props.accentColor;
  const visualMode = getVisualMode(props);

  return (
    <AbsoluteFill style={{ background: props.primaryColor, color: "white", fontFamily: "Inter, Arial, sans-serif" }}>
      {props.backgroundMusicUrl ? <Audio src={props.backgroundMusicUrl} volume={props.backgroundMusicVolume} /> : null}
      {props.voiceAudioUrl ? <Audio src={props.voiceAudioUrl} volume={props.voiceVolume} /> : null}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 22% 18%, ${accent}55, transparent 35%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))` }} />
      <div style={{ position: "absolute", top: 48, left: 64, right: 64, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: isPortrait ? 30 : 34, letterSpacing: 2, opacity: 0.72 }}>
        <span>{props.watermark}</span>
        <span>{props.template.replace("-", " ").toUpperCase()}</span>
      </div>

      <section style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: isPortrait ? "1fr" : "1.04fr 0.96fr", gap: isPortrait ? 44 : 72, height: "100%", padding: isPortrait ? "150px 72px 104px" : "140px 96px 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 34 }}>
          <div style={{ opacity: introOpacity }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 16, border: `2px solid ${accent}88`, borderRadius: 999, padding: "12px 22px", color: accent, fontWeight: 800, fontSize: isPortrait ? 26 : 30 }}>
              {badgeLabel(visualMode)}
            </div>
            <h1 style={{ margin: "32px 0 0", fontSize: isPortrait ? 78 : 92, lineHeight: 1, fontWeight: 900, letterSpacing: -4 }}>{props.title}</h1>
            <p style={{ margin: "28px 0 0", maxWidth: 980, color: "#cbd5e1", fontSize: isPortrait ? 34 : 38, lineHeight: 1.25 }}>{props.subtitle}</p>
          </div>

          <div style={{ border: "1px solid rgba(148,163,184,0.28)", background: "rgba(15,23,42,0.72)", borderRadius: 32, padding: 30, boxShadow: "0 24px 80px rgba(0,0,0,0.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 24, color: "#94a3b8", fontSize: isPortrait ? 23 : 25, fontWeight: 700 }}>
              <span>{props.algorithmLabel}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{ marginTop: 20, height: 12, borderRadius: 999, background: "rgba(148,163,184,0.22)", overflow: "hidden" }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", background: accent }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
          <VisualPanel mode={visualMode} data={props.data} accent={accent} progress={progress} isPortrait={isPortrait} title={props.title} subtitle={props.subtitle} narration={props.narration} />
          <div style={{ minHeight: isPortrait ? 190 : 150, borderRadius: 28, padding: 28, background: "rgba(2,6,23,0.62)", border: "1px solid rgba(148,163,184,0.25)", fontSize: isPortrait ? 30 : 32, lineHeight: 1.3, color: "#e2e8f0" }}>
            {props.narration}
          </div>
        </div>
      </section>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: "rgba(148,163,184,0.24)" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: accent }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: outroOpacity, pointerEvents: "none", background: "rgba(2,6,23,0.78)", fontSize: isPortrait ? 64 : 76, fontWeight: 900 }}>
        Ready for export
      </div>
    </AbsoluteFill>
  );
}

type VisualMode = "bars" | "maze";

function getVisualMode(props: RemotionVideoInputProps): VisualMode {
  return props.algorithmLabel.toLowerCase().includes("path") || props.title.toLowerCase().includes("maze") || props.title.toLowerCase().includes("mê cung") ? "maze" : "bars";
}

function badgeLabel(mode: VisualMode) {
  if (mode === "maze") return "MAZE RACE ENGINE";
  return "ALGORITHM ENGINE";
}

function VisualPanel(props: { mode: VisualMode; data: number[]; accent: string; progress: number; isPortrait: boolean; title: string; subtitle: string; narration: string }) {
  if (props.mode === "maze") return <MazePathVisual accent={props.accent} progress={props.progress} isPortrait={props.isPortrait} />;
  return <AnimatedBars data={props.data} accent={props.accent} progress={props.progress} isPortrait={props.isPortrait} />;
}

function MazePathVisual(props: { accent: string; progress: number; isPortrait: boolean }) {
  const walls = new Set([2, 3, 4, 10, 11, 12, 16, 18, 19, 24, 25, 26, 31, 33, 38, 39, 40]);
  const path = [0, 7, 14, 21, 28, 35, 42, 43, 44, 45, 46, 47, 48];
  const visiblePath = Math.max(1, Math.floor(path.length * props.progress));
  return (
    <div style={{ height: props.isPortrait ? 620 : 560, borderRadius: 36, padding: 34, background: "rgba(15,23,42,0.74)", border: "1px solid rgba(148,163,184,0.28)", boxShadow: "0 30px 90px rgba(0,0,0,0.35)", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: props.isPortrait ? 11 : 13 }}>
      {Array.from({ length: 49 }, (_, index) => {
        const pathIndex = path.indexOf(index);
        const onPath = pathIndex >= 0 && pathIndex < visiblePath;
        const start = index === 0;
        const end = index === 48;
        return (
          <div key={index} style={{ borderRadius: 16, background: walls.has(index) ? "#0f172a" : onPath ? props.accent : "rgba(148,163,184,0.22)", border: `2px solid ${onPath ? props.accent : "rgba(148,163,184,0.18)"}`, boxShadow: onPath ? `0 0 30px ${props.accent}88` : "none", display: "grid", placeItems: "center", color: start || end ? "#020617" : "white", fontWeight: 900, fontSize: props.isPortrait ? 26 : 30 }}>
            {start ? "S" : end ? "E" : onPath ? "•" : ""}
          </div>
        );
      })}
    </div>
  );
}

function AnimatedBars(props: { data: number[]; accent: string; progress: number; isPortrait: boolean }) {
  const max = Math.max(...props.data, 1);
  const sorted = [...props.data].sort((a, b) => a - b);
  const blend = props.progress;
  const values = props.data.map((value, index) => value + (sorted[index] - value) * blend);
  const activeIndex = Math.min(values.length - 1, Math.floor(blend * values.length));

  return (
    <div style={{ height: props.isPortrait ? 620 : 560, borderRadius: 36, padding: 34, display: "flex", alignItems: "end", gap: props.isPortrait ? 12 : 16, background: "rgba(15,23,42,0.74)", border: "1px solid rgba(148,163,184,0.28)", boxShadow: "0 30px 90px rgba(0,0,0,0.35)" }}>
      {values.map((value, index) => {
        const height = 14 + (value / max) * 86;
        const selected = index === activeIndex || index === activeIndex + 1;
        return (
          <div key={`${index}-${props.data[index]}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "end", gap: 12 }}>
            <div style={{ height: `${height}%`, borderRadius: "18px 18px 8px 8px", background: selected ? props.accent : "linear-gradient(180deg, #e2e8f0, #64748b)", boxShadow: selected ? `0 0 36px ${props.accent}88` : "none" }} />
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: props.isPortrait ? 20 : 22, fontWeight: 800 }}>{Math.round(value)}</div>
          </div>
        );
      })}
    </div>
  );
}
