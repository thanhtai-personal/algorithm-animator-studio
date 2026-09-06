import type { PresetVideoAspectRatio, PresetVideoOutputPreset } from "./types";

export type PresetVideoOutputSize = {
  id: PresetVideoOutputPreset;
  width: number;
  height: number;
  aspectRatio: PresetVideoAspectRatio;
  label: string;
};

export const PRESET_VIDEO_OUTPUT_SIZES: readonly PresetVideoOutputSize[] = [
  { id: "landscape-1080p", width: 1920, height: 1080, aspectRatio: "16:9", label: "Landscape · 1920×1080" },
  { id: "landscape-720p", width: 1280, height: 720, aspectRatio: "16:9", label: "Landscape · 1280×720" },
  { id: "portrait-1080p", width: 1080, height: 1920, aspectRatio: "9:16", label: "Portrait · 1080×1920" },
  { id: "portrait-720p", width: 720, height: 1280, aspectRatio: "9:16", label: "Portrait · 720×1280" },
  { id: "square-1080p", width: 1080, height: 1080, aspectRatio: "1:1", label: "Square · 1080×1080" },
];

export function getPresetVideoOutputSize(preset: PresetVideoOutputPreset) {
  return PRESET_VIDEO_OUTPUT_SIZES.find((item) => item.id === preset) ?? PRESET_VIDEO_OUTPUT_SIZES[0];
}

export function getPresetVideoDefaultDimensions(aspectRatio: PresetVideoAspectRatio) {
  if (aspectRatio === "9:16") return { width: 1080, height: 1920 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}
