import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { LONG_GAP_RAIL_MS } from "../features/rhythmic-studio/engine/longGapRailRouting";
import { buildMarbleCourse, marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import { isAutomaticLongGapRail, longGapRailPoints } from "../features/rhythmic-studio/lib/longGapRail";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "auto" as const, instrumentLayout: "cascade" as const };

function note(id: number, timeMs: number, midi = 60): NoteEvent {
  return { id: `long-${id}`, timeMs, midi, velocity: 0.82, durationMs: 240 };
}

describe("rhythmic long-gap rail routing", () => {
  it("uses distance instead of slow motion for the 818-1091 ms gaps common in imported MIDI", () => {
    const events = [note(0, 0), note(1, 818.182, 64), note(2, 1_909.091, 67)];
    const course = buildMarbleCourse(events, settings, 720);
    const start = course[0];
    const end = course[1];
    const dt = (events[1].timeMs - events[0].timeMs) / 1000;
    const speed = Math.hypot(start.outVX, start.outVY);
    const distance = Math.hypot(end.hitX - start.hitX, end.hitY - start.hitY);

    expect(LONG_GAP_RAIL_MS).toBeLessThanOrEqual(818.182);
    expect(start.motionMode).toBe("roll");
    expect(start.longRail).toBe(true);
    expect(isAutomaticLongGapRail(start, end)).toBe(true);
    expect(speed).toBeGreaterThanOrEqual(230);
    expect(distance / dt).toBeCloseTo(speed, 5);
    expect(distance).toBeGreaterThan(185);

    const quarter = marbleAtTime(events[0].timeMs + (events[1].timeMs - events[0].timeMs) * 0.25, events, course, settings);
    expect(Math.hypot(quarter.x - start.hitX, quarter.y - start.hitY)).toBeGreaterThan(45);
    expect(longGapRailPoints(start, end, 10)).toHaveLength(11);
  });

  it("keeps an ordinary 545 ms phrase as a real ballistic bounce", () => {
    const events = [note(0, 0), note(1, 545.455, 64), note(2, 1_090.91, 67)];
    const course = buildMarbleCourse(events, settings, 720);

    expect(course[0].longRail).not.toBe(true);
    expect(course[0].motionMode).toBe("ballistic");
  });
});
