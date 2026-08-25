import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { CourseItemOverride, InstrumentHitEvent, NoteEvent } from "../types";
import { instrumentHitForPlatform } from "./instrumentHitEvent";

interface EmitDueRhythmicHitsArgs {
  nextIndex: number;
  timeMs: number;
  events: NoteEvent[];
  platforms: MarblePlatform[];
  resolveSettings: StudioSettingsResolver;
  courseOverrides: CourseItemOverride[];
  onNote: (hit: InstrumentHitEvent) => void;
}

/** Keeps audio on one ordered source-event queue, independent of performer ownership. */
export function emitDueRhythmicHits(args: EmitDueRhythmicHitsArgs) {
  let index = args.nextIndex;
  while (index < args.events.length && args.events[index].timeMs <= args.timeMs) {
    args.onNote(instrumentHitForPlatform(
      index,
      args.platforms,
      args.resolveSettings(index),
      args.courseOverrides,
    ));
    index += 1;
  }
  return index;
}
