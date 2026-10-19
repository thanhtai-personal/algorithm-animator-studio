import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import type { PresetVideoCompositionProps } from "../../types";
import { FashionCeilingFan, FashionLivingRoom } from "./FashionStage";
import { FashionDemoModel } from "./FashionDemoModel";
import { getFashionCameraScale } from "./fashionSetTiming";
import { getFashionModelMotion, getFashionModelPose } from "./fashionModelMotion";
import { getFashionLookAtSeconds, resolveFashionOutfitSource } from "./fashionOutfitTimeline";


/**
 * Overhead view: a model rolls onto a blue rug beside a pink sofa.
 * A three-blade ceiling fan briefly masks each cut between outfit photos.
 * Transparent PNG models retain their alpha, so the living room remains visible.
 */
export function FashionClawComposition(props: PresetVideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  const seconds = frame / fps;
  const cameraScale = getFashionCameraScale(seconds);
  const userOutfits = props.timelineVideoClips
    .map((clip) => props.videoSourceUrls[clip.id])
    .filter((src): src is string => Boolean(src));
  // T04: render the animated mannequin by default; static stock photos cannot
  // bend arms and legs. Keep user-uploaded photos supported for the later custom stage.
  const outfits = userOutfits;
  // Cuts are reference-frame based and coincide with the fan hiding the torso.
  const look = getFashionLookAtSeconds(seconds);
  const active = resolveFashionOutfitSource(outfits, look.index);

  const model = getFashionModelMotion(seconds);
  const vectorPose = getFashionModelPose(seconds);
  // The animation lives in 360×640 reference pixels, scaled to the selected output size.
  const modelTransform = `translate(${(model.x * width) / 360}px, ${(model.y * height) / 640}px) rotate(${model.rotationDeg}deg) scale(${model.breathScale})`;

  return (
    <AbsoluteFill style={{ background: "#5e798a", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${cameraScale})`, transformOrigin: "50% 62%" }}>
        <FashionLivingRoom seconds={seconds} />
      {active ? (
        <AbsoluteFill style={{ transform: modelTransform, transformOrigin: "50% 51%" }}>
          <Img
            key={active}
            src={active}
            style={{
              position: "absolute", left: "12%", top: "17%", width: "76%", height: "75%",
              objectFit: "contain", objectPosition: "50% 50%",
              filter: "drop-shadow(0 11px 8px rgba(11,33,45,.25))",
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ transform: modelTransform, transformOrigin: "50% 51%" }}>
          <FashionDemoModel variation={look.index} pose={vectorPose} />
        </AbsoluteFill>
      )}
      <FashionCeilingFan seconds={seconds} imageSrc={props.videoSourceUrls["fashion-default-fan"]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
