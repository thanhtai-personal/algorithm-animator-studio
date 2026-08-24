import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { platformClearance, trajectoryPlatformClearance } from "../features/rhythmic-studio/engine/marbleCourseConstraints";
import { buildPhysicsCourse } from "../features/rhythmic-studio/engine/marbleCoursePlanner";
import { marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const settings = {
  ...DEFAULT_SETTINGS,
  instrumentFamily: "auto" as const,
  terrainProfile: "balanced" as const,
  ballSize: 14,
  platformThickness: 20,
  platformWidth: 104,
  platformGap: 145,
  laneSpread: 300,
};

function note(index: number, timeMs: number, isDrum = false): NoteEvent {
  return {
    id: `layout-${index}`,
    timeMs,
    midi: 52 + (index % 24),
    velocity: 0.78,
    durationMs: 80,
    isDrum,
  };
}

function stressEvents(seed: number, count = 72): NoteEvent[] {
  let timeMs = 0;
  let state = seed * 9173 + 31;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  const gaps = [0, 12, 110, 125, 145, 175, 230, 320, 460, 680];
  return Array.from({ length: count }, (_, index) => {
    if (index) timeMs += gaps[Math.floor(random() * gaps.length)];
    return {
      id: `stress-${seed}-${index}`,
      timeMs,
      midi: 48 + Math.floor(random() * 31),
      velocity: 0.55 + random() * 0.42,
      durationMs: 80,
      isDrum: random() < 0.24,
    };
  });
}

function sharesSurface(a: ReturnType<typeof buildPhysicsCourse>[number], b: ReturnType<typeof buildPhysicsCourse>[number]) {
  return (a.denseSurfaceId !== undefined && a.denseSurfaceId === b.denseSurfaceId)
    || (a.denseRunId !== undefined && a.denseRunId === b.denseRunId)
    || (a.chordClusterId !== undefined && a.chordClusterId === b.chordClusterId);
}

describe("collision-aware marble scene layout", () => {
  it("keeps chord-heavy rapid phrases on one playable surface", () => {
    const times = [0, 145, 145, 157, 267, 279, 424, 900];
    const events = times.map((timeMs, index) => note(index, timeMs));
    const platforms = buildPhysicsCourse(events, settings, 720, () => "#ffffff");

    expect(platforms.slice(0, 7).every((platform) => platform.denseRunId !== undefined)).toBe(true);
    expect(platforms[1].visualStyle).toBe("instrument-pad");
    expect(platforms[2].visualHidden).toBe(true);
    expect(platforms[3].visualHidden).toBe(true);
    expect(platforms[4].visualStyle).toBe("instrument-pad");
    expect(platforms[5].visualHidden).toBe(true);
  });

  it("does not let unrelated visible instrument bodies cross in stress layouts", () => {
    for (let seed = 1; seed <= 6; seed += 1) {
      const events = stressEvents(seed);
      const platforms = buildPhysicsCourse(events, settings, 720, (index) => index % 2 ? "#ffffff" : "#aaaaaa");
      for (let a = 0; a < platforms.length; a += 1) {
        const current = platforms[a];
        if (current.visualHidden) continue;
        for (let b = 0; b < a - 1; b += 1) {
          const previous = platforms[b];
          if (previous.visualHidden || sharesSurface(current, previous)) continue;
          expect(platformClearance(current, previous)).toBeGreaterThan(0.5);
        }
      }
    }
  });

  it("looks ahead before a future instrument can cut through an existing flight", () => {
    // CK3 had one reproducible failure in the 16x90 stress set: seed 8 routed
    // note 56 -> 57 through the body later placed for note 58. The future body
    // does not exist when note 56 is chosen, so only multi-step planning can
    // avoid this without a post-hoc teleport or destructive platform move.
    const events = stressEvents(8, 90);
    const platforms = buildPhysicsCourse(events, settings, 720, () => "#ffffff");

    for (let routeIndex = 0; routeIndex < platforms.length - 1; routeIndex += 1) {
      const start = platforms[routeIndex];
      const end = platforms[routeIndex + 1];
      if (start.motionMode === "hold") continue;
      for (let futureIndex = routeIndex + 2; futureIndex < platforms.length; futureIndex += 1) {
        const future = platforms[futureIndex];
        if (future.visualHidden || sharesSurface(start, future) || sharesSurface(end, future)) continue;
        expect(trajectoryPlatformClearance(future, start, end)).toBeGreaterThan(0.5);
      }
    }
  });

  it("preserves continuous marble position at note timestamps after layout fitting", () => {
    const events = stressEvents(11, 54);
    const platforms = buildPhysicsCourse(events, settings, 720, () => "#ffffff");
    for (let index = 1; index < events.length; index += 1) {
      const before = marbleAtTime(events[index].timeMs - 0.01, events, platforms, settings);
      const exact = marbleAtTime(events[index].timeMs, events, platforms, settings);
      expect(Math.hypot(before.x - exact.x, before.y - exact.y)).toBeLessThan(0.025);
    }
  });
});
