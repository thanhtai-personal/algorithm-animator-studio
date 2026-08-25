import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  prepareMarbleCourse,
} from "../features/rhythmic-studio/engine/marbleCoursePreparation";
import { createMarbleCourseWorkerPayload } from "../features/rhythmic-studio/engine/marbleCourseWorkerPayload";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const events: NoteEvent[] = [
  { id: "prepared-0", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 120 },
  { id: "prepared-1", timeMs: 12, midi: 64, velocity: 0.76, durationMs: 120 },
  { id: "prepared-2", timeMs: 180, midi: 67, velocity: 0.84, durationMs: 100 },
  { id: "prepared-3", timeMs: 340, midi: 69, velocity: 0.88, durationMs: 100 },
];

describe("prepared marble course mode boundary", () => {
  it("preserves the exact legacy planner result in single mode", () => {
    const settings = { ...DEFAULT_SETTINGS, marbleMode: "single" as const };
    const result = prepareMarbleCourse({
      events,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 17,
    });

    expect(result.mode).toBe("single");
    expect(result.chasePlan).toBeNull();
    expect(result.platforms).toEqual(buildMarbleCourse(events, settings, 720));
  });

  it("returns one serializable dual-track plan in chase mode", () => {
    const result = prepareMarbleCourse({
      events,
      settings: { ...DEFAULT_SETTINGS, marbleMode: "chase" },
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 17,
    });

    expect(result.mode).toBe("chase");
    expect(result.chasePlan).not.toBeNull();
    expect(result.platforms).toEqual(result.chasePlan?.platforms);
    expect(result.chasePlan?.platforms.map((platform) => platform.event.id)).toEqual(events.map((event) => event.id));
    expect(() => structuredClone(result)).not.toThrow();
  });

  it("deep-snapshots secondary marble settings before worker IO", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      marbleMode: "chase" as const,
      secondaryMarble: { ...DEFAULT_SETTINGS.secondaryMarble, ballStyle: "multicolor-glass" as const },
    };
    const payload = createMarbleCourseWorkerPayload({
      events,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 17,
    });

    settings.secondaryMarble.ballStyle = "classic";
    expect(payload.settings.secondaryMarble.ballStyle).toBe("multicolor-glass");
    expect(payload.settings.secondaryMarble).not.toBe(settings.secondaryMarble);
    expect(() => structuredClone(payload)).not.toThrow();
  });
});
