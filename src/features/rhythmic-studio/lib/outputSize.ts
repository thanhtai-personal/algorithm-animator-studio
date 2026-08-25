import type { RhythmicOutputPreset } from "../types";

export const RHYTHMIC_OUTPUT_PRESETS = ["portrait-720p", "landscape-720p"] as const;

export interface RhythmicOutputSize {
  preset: RhythmicOutputPreset;
  width: number;
  height: number;
  aspectLabel: "9:16" | "16:9";
  resolutionLabel: string;
}

const OUTPUT_SIZES: Record<RhythmicOutputPreset, RhythmicOutputSize> = {
  "portrait-720p": {
    preset: "portrait-720p",
    width: 720,
    height: 1280,
    aspectLabel: "9:16",
    resolutionLabel: "720×1280",
  },
  "landscape-720p": {
    preset: "landscape-720p",
    width: 1280,
    height: 720,
    aspectLabel: "16:9",
    resolutionLabel: "1280×720",
  },
};

export function normalizeRhythmicOutputPreset(value: unknown): RhythmicOutputPreset {
  return RHYTHMIC_OUTPUT_PRESETS.includes(value as RhythmicOutputPreset)
    ? value as RhythmicOutputPreset
    : "portrait-720p";
}

export function rhythmicOutputSize(value: unknown): RhythmicOutputSize {
  return OUTPUT_SIZES[normalizeRhythmicOutputPreset(value)];
}
