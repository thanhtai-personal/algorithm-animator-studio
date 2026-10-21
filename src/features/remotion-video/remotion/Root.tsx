import { Composition } from "remotion";
import { AlgorithmExplainerComposition } from "./AlgorithmExplainerComposition";
import { TimelineComposition } from "./TimelineComposition";
import { DEFAULT_REMOTION_VIDEO, getRemotionDimensions, normalizeRemotionVideoInput, type RemotionVideoInputProps } from "../lib/remotionVideoTypes";
import { DEFAULT_REMOTION_TIMELINE, getTimelineDurationSeconds, normalizeRemotionTimelineInput, type RemotionTimelineInputProps } from "../lib/remotionTimelineTypes";

export const REMOTION_ALGORITHM_COMPOSITION_ID = "AlgorithmExplainer";
export const REMOTION_TIMELINE_COMPOSITION_ID = "TimelineVideo";

export function RemotionRoot() {
  const defaults = normalizeRemotionVideoInput(DEFAULT_REMOTION_VIDEO);
  const dimensions = getRemotionDimensions(defaults.aspectRatio);
  const timelineDefaults = normalizeRemotionTimelineInput(DEFAULT_REMOTION_TIMELINE);
  const timelineDimensions = getRemotionDimensions(timelineDefaults.aspectRatio);

  return (
    <>
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
    <Composition<Partial<RemotionTimelineInputProps>>
      id={REMOTION_TIMELINE_COMPOSITION_ID}
      component={TimelineComposition}
      durationInFrames={Math.round(getTimelineDurationSeconds(timelineDefaults) * timelineDefaults.fps)}
      fps={timelineDefaults.fps}
      width={timelineDimensions.width}
      height={timelineDimensions.height}
      defaultProps={timelineDefaults}
      calculateMetadata={({ props }) => {
        const input = normalizeRemotionTimelineInput(props || timelineDefaults);
        const size = getRemotionDimensions(input.aspectRatio);
        return {
          durationInFrames: Math.round(getTimelineDurationSeconds(input) * input.fps),
          fps: input.fps,
          width: size.width,
          height: size.height,
        };
      }}
    />
    </>
  );
}
