import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  prepareMarbleCourse,
} from "../features/rhythmic-studio/engine/marbleCoursePreparation";
import { createMarbleCourseWorkerPayload } from "../features/rhythmic-studio/engine/marbleCourseWorkerPayload";
import {
  buildMarbleCourse,
  hasCompleteMarblePlatforms,
} from "../features/rhythmic-studio/lib/marbleCourse";
import { instrumentVoiceForPlatform } from "../features/rhythmic-studio/lib/instrumentHitProfiles";
import type { InstrumentMixSegment } from "../features/rhythmic-studio/lib/phraseInstrumentMix";
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
    expect(Array.from({ length: events.length }, (_, index) => result.platforms[index]).every(Boolean)).toBe(true);
    expect(result.chasePlan?.platforms.map((platform) => platform.event.id)).toEqual(events.map((event) => event.id));
    expect(() => structuredClone(result)).not.toThrow();
  });

  it("rejects sparse or stale platform arrays even when their lengths match", () => {
    const settings = { ...DEFAULT_SETTINGS, marbleMode: "single" as const };
    const dense = buildMarbleCourse(events, settings, 720);
    const sparse = dense.slice();
    delete sparse[1];
    const stale = dense.map((platform, index) => index === 2
      ? { ...platform, event: { ...platform.event, id: "different-midi-note" } }
      : platform);

    expect(hasCompleteMarblePlatforms(events, dense)).toBe(true);
    expect(sparse.length).toBe(events.length);
    expect(hasCompleteMarblePlatforms(events, sparse)).toBe(false);
    expect(hasCompleteMarblePlatforms(events, stale)).toBe(false);
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

  it("serializes a custom instrument schedule and changes both mesh and voice at its boundary", () => {
    const instrumentMixSegments: InstrumentMixSegment[] = [
      { id: "gong-section", family: "gong", startMs: 0, endMs: 200 },
      { id: "flute-section", family: "flute", startMs: 200, endMs: 1_000 },
    ];
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "mixed" as const };
    const payload = createMarbleCourseWorkerPayload({
      events,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 17,
      instrumentMixSegments,
    });
    const result = prepareMarbleCourse(payload);

    instrumentMixSegments[0].family = "piano";
    expect(payload.instrumentMixSegments[0].family).toBe("gong");
    expect(result.platforms[0].visualStyle).toBe("gong-disc");
    expect(result.platforms[3].visualStyle).toBe("flute-pipe");
    expect(instrumentVoiceForPlatform(result.platforms[0].visualStyle!, events[0], "piano")).toBe("gong");
    expect(instrumentVoiceForPlatform(result.platforms[3].visualStyle!, events[3], "piano")).toBe("flute");
    expect(() => structuredClone(payload)).not.toThrow();
  });
});
