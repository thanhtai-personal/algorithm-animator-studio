import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  platformClearance,
  platformVisualClearanceRequirement,
  trajectoryBodyClearanceRequirement,
  trajectoryPlatformClearance,
} from "../features/rhythmic-studio/engine/marbleCourseConstraints";
import { buildPhysicsCourse } from "../features/rhythmic-studio/engine/marbleCoursePlanner";
import { marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const rapidEvents: NoteEvent[] = Array.from({ length: 28 }, (_, index) => ({
  id: `corridor-${index}`,
  timeMs: index * 96,
  midi: 52 + ((index * 7) % 25),
  velocity: 0.72 + (index % 4) * 0.06,
  durationMs: 72,
  isDrum: index % 7 === 5,
}));

const settings = {
  ...DEFAULT_SETTINGS,
  ...presetById("reference-era-corridor" as never).settings,
};

describe("fast reference corridor", () => {
  it("uses separate physical impacts instead of a passive rolling strip", () => {
    const platforms = buildPhysicsCourse(rapidEvents, settings, 720, () => "#d1d5db");

    expect(platforms).toHaveLength(rapidEvents.length);
    expect(platforms.every((platform) => platform.motionMode === "ballistic")).toBe(true);
    expect(new Set(platforms.map((platform) => platform.visualStyle)).size).toBeGreaterThanOrEqual(3);
    for (const paddle of platforms.filter((platform) => platform.visualStyle === "instrument-pad")) {
      expect(paddle.visualWidth).toBeCloseTo(paddle.visualThickness ?? 0, 6);
    }
  });

  it("keeps unrelated paddles apart and outside every non-adjacent flight", () => {
    const platforms = buildPhysicsCourse(rapidEvents, settings, 720, () => "#d1d5db");

    for (let current = 0; current < platforms.length; current += 1) {
      for (let previous = 0; previous < current - 1; previous += 1) {
        expect(platformClearance(platforms[current], platforms[previous])).toBeGreaterThan(
          platformVisualClearanceRequirement(platforms[current], platforms[previous]),
        );
      }
    }
    for (let route = 0; route < platforms.length - 1; route += 1) {
      for (let future = route + 2; future < platforms.length; future += 1) {
        expect(trajectoryPlatformClearance(platforms[future], platforms[route], platforms[route + 1])).toBeGreaterThan(
          trajectoryBodyClearanceRequirement(platforms[future], settings),
        );
      }
    }
  });

  it("keeps the marble continuous at every fast impact", () => {
    const platforms = buildPhysicsCourse(rapidEvents, settings, 720, () => "#d1d5db");

    for (let index = 1; index < rapidEvents.length; index += 1) {
      const before = marbleAtTime(rapidEvents[index].timeMs - 0.01, rapidEvents, platforms, settings);
      const exact = marbleAtTime(rapidEvents[index].timeMs, rapidEvents, platforms, settings);
      expect(Math.hypot(before.x - exact.x, before.y - exact.y)).toBeLessThan(0.025);
    }
  });
});
