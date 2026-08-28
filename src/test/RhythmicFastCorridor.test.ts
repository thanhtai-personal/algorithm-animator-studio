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
import type { NoteEvent, StudioSettings } from "../features/rhythmic-studio/types";

const rapidEvents: NoteEvent[] = Array.from({ length: 28 }, (_, index) => ({
  id: `corridor-${index}`,
  timeMs: index * 96,
  midi: 52 + ((index * 7) % 25),
  velocity: 0.72 + (index % 4) * 0.06,
  durationMs: 72,
  isDrum: index % 7 === 5,
}));

const settings: StudioSettings = {
  ...DEFAULT_SETTINGS,
  terrainProfile: "xylophone",
  cameraProfile: "xylophone",
  backgroundPreset: "spotlight",
  backgroundColor: "#d7dee5",
  colorPaletteMode: "duotone",
  prismStart: "#303238",
  prismEnd: "#d6dbe0",
  ballStyle: "glass",
  ballBaseColor: "#9fffc8",
  platformPrimaryStyle: "instrument-pad",
  platformSecondaryStyle: "instrument-cymbal",
  platformAccentStyle: "piano-key",
  platformMixMode: "accent",
  platformAccentEvery: 8,
  instrumentFamily: "mixed",
  instrumentLayout: "corridor",
  showcaseRails: true,
  showcaseRailDensity: 0.86,
  platformWidth: 106,
  platformThickness: 18,
  platformGap: 132,
  laneSpread: 260,
  minBounceDistance: 44,
  bounceHeight: 56,
  curveIntensity: 0,
  curvePathLength: 0,
};

describe("fast reference corridor", () => {
  it("uses a compact rolling surface instead of impossible distant micro-bounces", () => {
    const platforms = buildPhysicsCourse(rapidEvents, settings, 720, () => "#d1d5db");

    expect(platforms).toHaveLength(rapidEvents.length);
    const denseSegments = platforms.slice(0, -1).filter((platform) => platform.denseRunId !== undefined);
    expect(denseSegments.filter((platform) => platform.motionMode === "roll").length).toBeGreaterThan(24);
    expect(platforms.slice(0, -1).every((platform) => platform.denseLayout !== undefined)).toBe(true);
    const styles = new Set(platforms.map((platform) => platform.visualStyle));
    expect(styles.has("piano-key")).toBe(true);
    expect(styles.has("instrument-pad")).toBe(true);
  });

  it("keeps unrelated paddles apart and outside every non-adjacent flight", () => {
    const platforms = buildPhysicsCourse(rapidEvents, settings, 720, () => "#d1d5db");

    for (let current = 0; current < platforms.length; current += 1) {
      for (let previous = 0; previous < current - 1; previous += 1) {
        if (platforms[current].denseSurfaceId !== undefined
          && platforms[current].denseSurfaceId === platforms[previous].denseSurfaceId) continue;
        expect(platformClearance(platforms[current], platforms[previous]), `${current}:${previous}`).toBeGreaterThan(
          platformVisualClearanceRequirement(platforms[current], platforms[previous]),
        );
      }
    }
    for (let route = 0; route < platforms.length - 1; route += 1) {
      for (let future = route + 2; future < platforms.length; future += 1) {
        if (platforms[future].denseSurfaceId !== undefined
          && (platforms[future].denseSurfaceId === platforms[route].denseSurfaceId
            || platforms[future].denseSurfaceId === platforms[route + 1].denseSurfaceId)) continue;
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
