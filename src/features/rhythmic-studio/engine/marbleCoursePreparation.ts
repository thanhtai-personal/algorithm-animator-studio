import type { MarbleMode, NoteEvent, StudioSettings } from "../types";
import { buildChaseCourse, type ChaseCoursePlan } from "../lib/chaseCourse";
import { buildMarbleCourse } from "../lib/marbleCourse";
import { buildPresetMixPlan, createPresetMixSettingsResolver } from "../lib/presetMix";
import {
  createInstrumentMixSettingsResolver,
  type InstrumentMixSegment,
} from "../lib/phraseInstrumentMix";
import type { MarblePlatform } from "./marblePhysicsTypes";

export interface MarbleCoursePreparationInput {
  events: NoteEvent[];
  settings: StudioSettings;
  width: number;
  presetMixEnabled: boolean;
  presetMixSeed: number;
  instrumentMixSegments?: InstrumentMixSegment[];
}

export interface MarbleCoursePreparationResult {
  mode: MarbleMode;
  platforms: MarblePlatform[];
  chasePlan: ChaseCoursePlan | null;
}

export function prepareMarbleCourse(
  input: MarbleCoursePreparationInput,
  onProgress?: (progress: number) => void,
): MarbleCoursePreparationResult {
  const mixPlan = buildPresetMixPlan(input.events, input.presetMixEnabled, input.presetMixSeed);
  const resolvePresetSettings = createPresetMixSettingsResolver(input.settings, mixPlan);
  const resolveSettings = input.instrumentMixSegments?.length
    ? createInstrumentMixSettingsResolver(input.events, input.instrumentMixSegments, resolvePresetSettings)
    : resolvePresetSettings;
  if (input.settings.marbleMode === "chase") {
    const chasePlan = buildChaseCourse(input.events, input.settings, input.width, resolveSettings, onProgress);
    return { mode: "chase", platforms: chasePlan.platforms, chasePlan };
  }
  return {
    mode: "single",
    platforms: buildMarbleCourse(input.events, input.settings, input.width, resolveSettings, onProgress),
    chasePlan: null,
  };
}
