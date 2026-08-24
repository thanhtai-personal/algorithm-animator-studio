import type { NoteEvent, StudioSettings } from "../types";
import { buildMarbleCourse } from "../lib/marbleCourse";
import { buildPresetMixPlan, createPresetMixSettingsResolver } from "../lib/presetMix";
import type { MarblePlatform } from "./marblePhysicsTypes";

export interface MarbleCoursePreparationInput {
  events: NoteEvent[];
  settings: StudioSettings;
  width: number;
  presetMixEnabled: boolean;
  presetMixSeed: number;
}

export interface MarbleCoursePreparationResult {
  platforms: MarblePlatform[];
}

export function prepareMarbleCourse(
  input: MarbleCoursePreparationInput,
  onProgress?: (progress: number) => void,
): MarbleCoursePreparationResult {
  const mixPlan = buildPresetMixPlan(input.events, input.presetMixEnabled, input.presetMixSeed);
  const resolveSettings = createPresetMixSettingsResolver(input.settings, mixPlan);
  return {
    platforms: buildMarbleCourse(input.events, input.settings, input.width, resolveSettings, onProgress),
  };
}
