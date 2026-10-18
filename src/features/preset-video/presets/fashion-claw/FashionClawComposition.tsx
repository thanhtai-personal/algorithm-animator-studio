import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";

const SWITCH_SECONDS = 0.96;

/**
 * Every uploaded photo is converted to a 10-second silent video by the existing
 * preset media cache. This keeps preview and server render on the same path.
 * No AI outfit synthesis or person tracking is implied.
 */
export function FashionClawComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const outfits = props.timelineVideoClips.filter((item) => Boolean(props.videoSourceUrls[item.id]));
  const switchFrames = Math.max(1, Math.round(SWITCH_SECONDS * fps));
  const beatIndex = Math.floor(frame / switchFrames);
  const withinBeat = frame % switchFrames;
  const gap = Math.min(withinBeat, switchFrames - withinBeat);
  const impact = Math.max(0, 1 - gap / Math.max(1, fps * 0.18));
  const sway = Math.sin(frame / fps * 2.2) * 1.6;
  const active = outfits.length ? outfits[beatIndex % outfits.length] : undefined;
  const horizontal = width > height;
  const entrance = interpolate(frame, [0, fps * 0.25], [0.92, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#607381" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #8d9fa8 0%, #627988 58%, #384957 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.15, backgroundImage: "repeating-linear-gradient(135deg, transparent 0px, transparent 3px, #1e2e3b 4px, transparent 5px)" }} />

      {active ? (
        <AbsoluteFill style={{ overflow: "hidden", transform: `scale(${entrance})` }}>
          <Video
            key={active.id}
            src={props.videoSourceUrls[active.id]}
            muted
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              objectPosition: "50% 50%",
              filter: "saturate(1.05) contrast(1.035)",
              transform: `scale(${1.012 + Math.sin(frame / fps * 1.7) * 0.008})`,
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12%" }}>
          <div style={{ maxWidth: 720, textAlign: "center", color: "#f5e6d7", fontFamily: "Arial, sans-serif" }}>
            <div style={{ fontSize: horizontal ? 60 : 72, fontWeight: 900 }}>FASHION CLAW</div>
            <div style={{ marginTop: 28, fontSize: horizontal ? 26 : 34, lineHeight: 1.4 }}>Chọn ít nhất 2 ảnh người mẫu mặc trang phục để xem video.</div>
          </div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(13,22,31,.16), transparent 25%, transparent 75%, rgba(13,22,31,.15))" }} />
      <MechanicClaw impact={impact} sway={sway} />
      {outfits.length >= 2 ? (
        <div style={{ position: "absolute", bottom: "5%", right: "5%", padding: "7px 13px", borderRadius: 50, background: "rgba(25,27,29,.32)", color: "#fff", font: "600 15px Arial, sans-serif", letterSpacing: 1 }}>
          {String((beatIndex % outfits.length) + 1).padStart(2, "0")} / {String(outfits.length).padStart(2, "0")}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function MechanicClaw({ impact, sway }: { impact: number; sway: number }) {
  // Jaws swing down across the subject as each new photo takes over.
  const leftAngle = -12 + impact * 27 + sway;
  const rightAngle = 12 - impact * 27 - sway;
  const sweepY = -5 + impact * 18;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMin slice" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id="fashion-copper" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#4e3026" />
            <stop offset="15%" stopColor="#b38465" />
            <stop offset="35%" stopColor="#e6c29d" />
            <stop offset="58%" stopColor="#7d523d" />
            <stop offset="80%" stopColor="#c89b73" />
            <stop offset="100%" stopColor="#463028" />
          </linearGradient>
          <linearGradient id="fashion-blade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#53392c" />
            <stop offset="22%" stopColor="#a67a5d" />
            <stop offset="47%" stopColor="#efc9a4" />
            <stop offset="58%" stopColor="#92694f" />
            <stop offset="100%" stopColor="#4e3429" />
          </linearGradient>
          <radialGradient id="fashion-hub">
            <stop offset="0%" stopColor="#f9d7b5" />
            <stop offset="38%" stopColor="#ad805d" />
            <stop offset="82%" stopColor="#4b3028" />
            <stop offset="100%" stopColor="#201714" />
          </radialGradient>
          <filter id="fashion-shadow" x="-35%" y="-20%" width="180%" height="150%">
            <feDropShadow dx="2" dy="9" stdDeviation="7" floodOpacity="0.42" />
          </filter>
        </defs>

        <g transform={`translate(0 ${sweepY})`} filter="url(#fashion-shadow)">
          <g transform={`rotate(${leftAngle} 82 79)`}>
            <path d="M72 63 L105 80 L136 110 L165 292 L136 314 L90 155 L27 123 Z"
              fill="url(#fashion-blade)" stroke="#51382c" strokeWidth="2" />
            <path d="M92 93 L135 128 L158 289" fill="none" stroke="#ffdfb7" strokeOpacity=".44" strokeWidth="4" />
            <circle cx="84" cy="83" r="16" fill="url(#fashion-hub)" stroke="#714e38" strokeWidth="4" />
            <circle cx="84" cy="83" r="5" fill="#d8af88" />
          </g>
          <g transform={`rotate(${rightAngle} 278 79)`}>
            <path d="M288 63 L255 80 L224 110 L195 292 L224 314 L270 155 L333 123 Z"
              fill="url(#fashion-blade)" stroke="#51382c" strokeWidth="2" />
            <path d="M268 93 L225 128 L202 289" fill="none" stroke="#ffdfb7" strokeOpacity=".44" strokeWidth="4" />
            <circle cx="276" cy="83" r="16" fill="url(#fashion-hub)" stroke="#714e38" strokeWidth="4" />
            <circle cx="276" cy="83" r="5" fill="#d8af88" />
          </g>
          <ellipse cx="180" cy="-34" rx="174" ry="118" fill="url(#fashion-copper)" stroke="#593b2f" strokeWidth="8" />
          <ellipse cx="180" cy="5" rx="148" ry="84" fill="none" stroke="#ffdab1" strokeOpacity=".42" strokeWidth="5" />
          <path d="M30 54 Q180 111 330 54 L316 78 Q180 130 44 78 Z" fill="url(#fashion-blade)" stroke="#4d3329" strokeWidth="3" />
          <circle cx="180" cy="40" r="29" fill="url(#fashion-hub)" stroke="#51372c" strokeWidth="7" />
          <circle cx="180" cy="40" r="9" fill="#b38969" stroke="#e6bc92" strokeWidth="3" />
          {[52, 308].map((x) => <g key={x}><circle cx={x} cy="47" r="6" fill="#4b362d" /><circle cx={x - 1} cy="46" r="2" fill="#efd0a9" /></g>)}
        </g>
        {impact > 0 ? <path d="M160 85 L200 85 L208 640 L144 640 Z" fill="url(#fashion-blade)" opacity={Math.pow(impact, 1.6) * 0.94} /> : null}
      </svg>
    </AbsoluteFill>
  );
}
