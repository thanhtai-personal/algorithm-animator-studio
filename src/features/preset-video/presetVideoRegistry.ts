import { algorithmExplainerPreset } from "./presets/algorithmExplainerPreset";
import { numberEightInRedPreset } from "./presets/number-eight-in-red/numberEightInRedPreset";
import type { PresetVideoDefinition } from "./types";

/**
 * Source-controlled registry for code-generated video presets.
 *
 * AI patches add a preset component + metadata, then register it in this array.
 * The library, preview and Remotion renderer discover it automatically.
 */
export const PRESET_VIDEO_REGISTRY: readonly PresetVideoDefinition[] = [
  algorithmExplainerPreset,
  numberEightInRedPreset,
];

export function getPresetVideoDefinition(presetId: string) {
  return PRESET_VIDEO_REGISTRY.find((preset) => preset.id === presetId);
}
