import { Composition } from "remotion";
import { AlgorithmExplainerComposition } from "./AlgorithmExplainerComposition";
import { TimelineComposition } from "./TimelineComposition";
import { DEFAULT_REMOTION_VIDEO, getRemotionDimensions, normalizeRemotionVideoInput, type RemotionVideoInputProps } from "../lib/remotionVideoTypes";
import { DEFAULT_REMOTION_TIMELINE, getTimelineDurationSeconds, normalizeRemotionTimelineInput, type RemotionTimelineInputProps } from "../lib/remotionTimelineTypes";
import { PresetVideoComposition, DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS } from "../../preset-video/PresetVideoComposition";
import { getPresetVideoDefaultDimensions } from "../../preset-video/outputPresets";
import type { PresetVideoCompositionProps } from "../../preset-video/types";
// MathSinCosV1 uses the preset composition so CLI/export both include optional narration.
import { MATH_FRAMES, MATH_FPS, MATH_WIDTH, MATH_HEIGHT, MATH_SECONDS } from "../../math-video/mathTimeline";

export const REMOTION_ALGORITHM_COMPOSITION_ID = "AlgorithmExplainer";
export const REMOTION_TIMELINE_COMPOSITION_ID = "TimelineVideo";
export const REMOTION_PRESET_VIDEO_COMPOSITION_ID = "PresetVideo";

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
    <Composition<Partial<PresetVideoCompositionProps>>
      id={REMOTION_PRESET_VIDEO_COMPOSITION_ID}
      component={PresetVideoComposition}
      durationInFrames={Math.round(DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS.durationSeconds * DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS.fps)}
      fps={DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS.fps}
      width={getPresetVideoDefaultDimensions(DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS.aspectRatio).width}
      height={getPresetVideoDefaultDimensions(DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS.aspectRatio).height}
      defaultProps={DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS}
      calculateMetadata={({ props }) => {
        const input = { ...DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS, ...props };
        const size = getPresetVideoDefaultDimensions(input.aspectRatio);
        return {
          durationInFrames: Math.max(1, Math.round(input.durationSeconds * input.fps)),
          fps: input.fps,
          width: size.width,
          height: size.height,
        };
      }}
    />
      <Composition<PresetVideoCompositionProps>
        id="MathSinCosV1"
        component={PresetVideoComposition}
        durationInFrames={MATH_FRAMES}
        fps={MATH_FPS}
        width={MATH_WIDTH}
        height={MATH_HEIGHT}
        defaultProps={{
          ...DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS,
          presetId: "math-sincos-v1",
          durationSeconds: MATH_SECONDS,
          fps: MATH_FPS,
          aspectRatio: "16:9",
          language: "vi",
        }}
      />
    </>
  );
}
