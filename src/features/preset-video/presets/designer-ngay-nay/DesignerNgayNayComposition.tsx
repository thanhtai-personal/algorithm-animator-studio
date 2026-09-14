import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { DESIGNER_NGAY_NAY_BEATS, type DesignerNgayNayBeat } from "./designerNgayNayContent";

const INK = "#05060a";
const PAPER = "#f8fafc";

export function DesignerNgayNayComposition(props: PresetVideoCompositionProps) {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: INK, color: PAPER, fontFamily: "Inter, Arial, sans-serif", overflow: "hidden" }}>
      {DESIGNER_NGAY_NAY_BEATS.map((beat, index) => {
        const from = Math.round(beat.start * fps);
        const durationInFrames = Math.max(1, Math.round((beat.end - beat.start) * fps));
        return (
          <Sequence key={beat.sourceId} from={from} durationInFrames={durationInFrames} premountFor={fps}>
            <BeatScene
              beat={beat}
              src={props.videoSourceUrls[beat.sourceId]}
              index={index}
              durationInFrames={durationInFrames}
              portrait={props.aspectRatio === "9:16"}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

function BeatScene(props: { beat: DesignerNgayNayBeat; src?: string; index: number; durationInFrames: number; portrait: boolean }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const progress = clamp01(frame / Math.max(1, props.durationInFrames - 1));
  const eased = Easing.inOut(Easing.cubic)(progress);
  const enter = interpolate(frame, [0, Math.round(fps * 0.22)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const exit = interpolate(frame, [props.durationInFrames - Math.round(fps * 0.16), props.durationInFrames - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shortest = Math.min(width, height);
  const isHook = props.index === 0;
  const isCta = props.index === DESIGNER_NGAY_NAY_BEATS.length - 1;
  const direction = props.index % 2 === 0 ? 1 : -1;
  const focusX = props.portrait ? clamp(props.beat.focusX + (eased * 2 - 1) * 10 * direction, 14, 86) : props.beat.focusX;
  const scale = props.portrait ? 1.03 + eased * 0.035 : 1.005 + eased * 0.012;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: Math.min(enter, exit) }}>
      {props.src ? (
        <Video
          src={props.src}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focusX}% ${props.beat.focusY}%`, transform: `scale(${scale})`, filter: "saturate(1.04) contrast(1.06) brightness(0.84)" }}
          fallbackOffthreadVideoProps={{ delayRenderTimeoutInMilliseconds: 120_000, delayRenderRetries: 1 }}
        />
      ) : (
        <AbsoluteFill style={{ display: "grid", placeItems: "center", background: `radial-gradient(circle at 50% 45%, ${props.beat.accent}22, transparent 42%), ${INK}` }}>
          <div style={{ color: "rgba(255,255,255,.56)", fontSize: 22, fontWeight: 800 }}>SELECT SOURCE RECORDING</div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(5,6,10,.08) 24%, rgba(5,6,10,.2) 52%, rgba(5,6,10,.88) 100%), linear-gradient(105deg, ${props.beat.accent}18, transparent 42%)` }} />

      <div style={{ position: "absolute", left: props.portrait ? "7%" : "5%", right: props.portrait ? "7%" : "5%", top: props.portrait ? "8%" : "7%", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: props.portrait ? 22 : 18, fontWeight: 900, letterSpacing: "0.13em", textTransform: "uppercase", opacity: 0.86 }}>
        <span>Designer ngày nay</span><span>{String(props.index + 1).padStart(2, "0")} / {String(DESIGNER_NGAY_NAY_BEATS.length).padStart(2, "0")}</span>
      </div>

      <div style={{ position: "absolute", left: props.portrait ? "7%" : "5%", right: props.portrait ? "7%" : "22%", bottom: props.portrait ? "13%" : "9%", transform: `translateY(${(1 - enter) * 24}px)`, textShadow: "0 10px 36px rgba(0,0,0,.78)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontSize: props.portrait ? 25 : 20, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: props.beat.accent }}>
          <span style={{ width: props.portrait ? 36 : 44, height: 4, borderRadius: 99, background: props.beat.accent, boxShadow: `0 0 20px ${props.beat.accent}88` }} />{props.beat.eyebrow}
        </div>
        <div style={{ marginTop: props.portrait ? 18 : 12, maxWidth: props.portrait ? "96%" : "82%", fontSize: shortest * (isHook ? 0.092 : isCta ? 0.078 : 0.074), lineHeight: 0.94, fontWeight: 950, letterSpacing: "-0.055em", textTransform: "uppercase" }}>{props.beat.headline}</div>
        <div style={{ marginTop: props.portrait ? 18 : 12, maxWidth: props.portrait ? "88%" : "66%", fontSize: shortest * (props.portrait ? 0.036 : 0.026), lineHeight: 1.18, fontWeight: 700, color: "rgba(248,250,252,.82)" }}>{props.beat.subline}</div>
      </div>

      <div style={{ position: "absolute", left: 0, bottom: 0, width: `${progress * 100}%`, height: props.portrait ? 7 : 5, background: props.beat.accent, boxShadow: `0 0 18px ${props.beat.accent}88` }} />
    </AbsoluteFill>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}
