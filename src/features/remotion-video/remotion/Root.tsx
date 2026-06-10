import { Composition } from "remotion";
import { AlgorithmExplainerComposition } from "./AlgorithmExplainerComposition";
import { DEFAULT_REMOTION_VIDEO, getRemotionDimensions, normalizeRemotionVideoInput, type RemotionVideoInputProps } from "../lib/remotionVideoTypes";

export const REMOTION_ALGORITHM_COMPOSITION_ID = "AlgorithmExplainer";

export function RemotionRoot() {
  const defaults = normalizeRemotionVideoInput(DEFAULT_REMOTION_VIDEO);
  const dimensions = getRemotionDimensions(defaults.aspectRatio);

  return (
    <Composition<Partial<RemotionVideoInputProps>>
      id={REMOTION_ALGORITHM_COMPOSITION_ID}
      component={AlgorithmExplainerComposition}
      durationInFrames={Math.round(defaults.durationSeconds * defaults.fps)}
      fps={defaults.fps}
      width={dimensions.width}
      height={dimensions.height}
      defaultProps={defaults}
      calculateMetadata={({ props }) => {
        const input = normalizeRemotionVideoInput(props || defaults);
        const size = getRemotionDimensions(input.aspectRatio);
        return {
          durationInFrames: Math.round(input.durationSeconds * input.fps),
          fps: input.fps,
          width: size.width,
          height: size.height,
        };
      }}
    />
  );
}
