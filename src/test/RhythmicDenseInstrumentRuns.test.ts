import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse, marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function note(index: number, timeMs: number, isDrum = false): NoteEvent {
  return {
    id: `dense-${index}`,
    timeMs,
    midi: 60 + (index % 12),
    velocity: 0.82,
    durationMs: 90,
    isDrum,
  };
}

const settings = {
  ...DEFAULT_SETTINGS,
  instrumentFamily: "auto" as const,
  terrainProfile: "balanced" as const,
  ballSize: 14,
  laneSpread: 300,
  platformWidth: 100,
};

describe("rhythmic dense instrument routing", () => {
  it("turns auto-mode dense notes into a continuous keyboard and rolls off without a velocity snap", () => {
    const events = Array.from({ length: 8 }, (_, index) => note(index, index * 125));
    events.push(note(8, 8 * 125 + 520));

    const platforms = buildMarbleCourse(events, settings, 720);
    const dense = platforms.slice(0, 8);

    expect(dense.every((platform) => platform.denseRunId !== undefined)).toBe(true);
    expect(dense.every((platform) => platform.visualStyle === "piano-key")).toBe(true);
    expect(dense.every((platform) => platform.visualHidden !== true)).toBe(true);
    expect(dense.slice(0, -1).every((platform) => platform.motionMode === "roll")).toBe(true);

    const beforeExit = dense[dense.length - 2];
    const exit = dense[dense.length - 1];
    expect(exit.outVX).toBeCloseTo(beforeExit.outVX, 8);
    expect(exit.outVY).toBeCloseTo(beforeExit.outVY, 8);

    for (let index = 1; index < events.length; index += 1) {
      const before = marbleAtTime(events[index].timeMs - 0.01, events, platforms, settings);
      const exact = marbleAtTime(events[index].timeMs, events, platforms, settings);
      expect(Math.hypot(before.x - exact.x, before.y - exact.y)).toBeLessThan(0.02);
    }
  });

  it("uses a contiguous pad strip for dense percussion instead of melodic keys", () => {
    const events = Array.from({ length: 6 }, (_, index) => note(index, index * 130, true));
    events.push(note(6, 1400, true));

    const platforms = buildMarbleCourse(events, settings, 720);
    expect(platforms.slice(0, 6).every((platform) => platform.visualStyle === "instrument-pad")).toBe(true);
  });
});
