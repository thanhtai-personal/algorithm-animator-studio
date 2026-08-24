import type { NoteEvent, StudioSettings } from "../types";
import type { MarbleCoursePreparationInput } from "./marbleCoursePreparation";

export interface MarbleCourseWorkerPayloadInput {
  events: NoteEvent[];
  settings: StudioSettings;
  width: number;
  presetMixEnabled: boolean;
  presetMixSeed: number;
}

function snapshotOptionalNumber(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Number(value);
}

function snapshotNoteEvent(event: NoteEvent): NoteEvent {
  return {
    id: String(event.id),
    timeMs: Number(event.timeMs),
    midi: Number(event.midi),
    velocity: Number(event.velocity),
    durationMs: Number(event.durationMs),
    channel: snapshotOptionalNumber(event.channel),
    program: snapshotOptionalNumber(event.program),
    isDrum: event.isDrum === undefined ? undefined : Boolean(event.isDrum),
  };
}

function snapshotStudioSettings(settings: StudioSettings): StudioSettings {
  // StudioSettings currently contains primitive fields only. Spreading across this
  // boundary intentionally strips MobX observable/proxy identity before Worker IO.
  return { ...settings };
}

export function createMarbleCourseWorkerPayload(
  input: MarbleCourseWorkerPayloadInput,
): MarbleCoursePreparationInput {
  return {
    events: Array.from(input.events, snapshotNoteEvent),
    settings: snapshotStudioSettings(input.settings),
    width: Number(input.width),
    presetMixEnabled: Boolean(input.presetMixEnabled),
    presetMixSeed: Number(input.presetMixSeed),
  };
}

export function workerPostMessageError(error: unknown): string {
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "DataCloneError") {
    return "Course worker input could not be serialized";
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
