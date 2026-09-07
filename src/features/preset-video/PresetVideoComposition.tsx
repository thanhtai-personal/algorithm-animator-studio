import { AbsoluteFill, Audio } from "remotion";
import { getPresetVideoDefinition, PRESET_VIDEO_REGISTRY } from "./presetVideoRegistry";
import { getPresetVideoOutputSize } from "./outputPresets";
import type { PresetVideoCompositionProps } from "./types";

const fallbackPreset = PRESET_VIDEO_REGISTRY[0];

export const DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS: PresetVideoCompositionProps = {
  presetId: fallbackPreset?.id ?? "missing-preset",
  aspectRatio: fallbackPreset ? getPresetVideoOutputSize(fallbackPreset.defaultOutputPreset).aspectRatio : "16:9",
  durationSeconds: fallbackPreset?.defaultDurationSeconds ?? 10,
  fps: fallbackPreset?.defaultFps ?? 30,
  backgroundMusicUrl: "",
  backgroundMusicVolume: 0.22,
  originalAudioVolume: 1,
  lyricTimings: {},
  videoSourceUrls: {},
};

export function PresetVideoComposition(rawProps: Partial<PresetVideoCompositionProps>) {
  const props = { ...DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS, ...rawProps };
  const preset = getPresetVideoDefinition(props.presetId);
  if (!preset) {
    throw new Error(`Preset video "${props.presetId}" chưa được đăng ký.`);
  }

  const Visual = preset.component;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Visual {...props} />
      {props.backgroundMusicUrl ? <Audio src={props.backgroundMusicUrl} volume={props.backgroundMusicVolume} /> : null}
    </AbsoluteFill>
  );
}
