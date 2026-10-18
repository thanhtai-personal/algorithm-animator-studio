import { AbsoluteFill, Easing, Img, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { FashionCeilingFan, FashionLivingRoom } from "./FashionStage";
import { FashionDemoModel } from "./FashionDemoModel";

const OUTFIT_SWITCH_SECONDS = .96;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Overhead view: a model rolls onto a blue rug beside a pink sofa.
 * A three-blade ceiling fan briefly masks each cut between outfit photos.
 * Transparent PNG models retain their alpha, so the living room remains visible.
 */
export function FashionClawComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const seconds = frame / fps;
  const outfits = props.timelineVideoClips.filter((clip) => Boolean(props.videoSourceUrls[clip.id]));
  const beatIndex = Math.floor((seconds + OUTFIT_SWITCH_SECONDS / 2) / OUTFIT_SWITCH_SECONDS);
  const activeIndex = outfits.length ? beatIndex % outfits.length : 0;
  const active = outfits[activeIndex];

  // Roll down from the top, settle flat onto the rug before the first blade pass.
  const rolling = Easing.out(Easing.cubic)(clamp(seconds / .44));
  const firstEntrance = 1 - rolling;
  const insideBeat = (seconds + OUTFIT_SWITCH_SECONDS / 2) % OUTFIT_SWITCH_SECONDS;
  const changeEase = Easing.out(Easing.quad)(clamp(insideBeat / .17));
  const outfitArrival = activeIndex && !firstEntrance ? 1 - changeEase : 0;
  const drift = Math.sin(seconds * 3) * 2;
  const translateY = -height * .68 * firstEntrance - 20 * outfitArrival + drift;
  const rotateDeg = -310 * firstEntrance + 9 * outfitArrival + Math.sin(seconds * 2.4) * 1.2;
  const translateX = -width * .17 * firstEntrance + 8 * outfitArrival;

  return (
    <AbsoluteFill style={{ background: "#5e798a", overflow: "hidden" }}>
      <FashionLivingRoom />
      {active ? (
        <AbsoluteFill style={{ transform: "translate(" + translateX + "px, " + translateY + "px) rotate(" + rotateDeg + "deg)" }}>
          <Img
            key={active.id}
            src={props.videoSourceUrls[active.id]}
            style={{
              position: "absolute", left: "20%", top: "22%", width: "76%", height: "72%",
              objectFit: "contain", objectPosition: "50% 50%",
              filter: "drop-shadow(0 11px 8px rgba(11,33,45,.25))",
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ transform: "translate(" + translateX + "px, " + translateY + "px) rotate(" + rotateDeg + "deg)" }}>
          <FashionDemoModel variation={beatIndex} />
        </AbsoluteFill>
      )}
      <FashionCeilingFan seconds={seconds} />
      {!active ? (
        <div style={{
          position: "absolute", bottom: "7%", left: "15%", right: "15%",
          borderRadius: 12, padding: "12px 15px", textAlign: "center",
          background: "rgba(16, 31, 43, .76)", color: "#f9ede2",
          fontFamily: "Arial, sans-serif", fontSize: Math.min(width, height) * .034,
          lineHeight: 1.35, fontWeight: 700,
        }}>
          Hình người mẫu minh họa. Chọn ít nhất 2 ảnh trang phục để thay thế.
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
