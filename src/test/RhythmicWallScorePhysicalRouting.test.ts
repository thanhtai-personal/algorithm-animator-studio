import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  buildMarbleCourse,
  longGapTubeGeometry,
  longGapTubePoint,
  marbleAtTime,
} from "../features/rhythmic-studio/lib/marbleCourse";
import {
  longGapRailPoints,
  longGapRailSupportPoints,
} from "../features/rhythmic-studio/lib/longGapRail";
import { isAutomaticLongGapTubeSegment } from "../features/rhythmic-studio/lib/longGapTube";
import { automaticLongGapRailGroups3D } from "../features/rhythmic-studio/components/RhythmicGuideRails3D";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const WIDTH = 720;
const settings = {
  ...DEFAULT_SETTINGS,
  instrumentFamily: "piano" as const,
  instrumentLayout: "wall-score" as const,
};

function note(index: number, timeMs: number): NoteEvent {
  return {
    id: `physical-route-${index}`,
    timeMs,
    midi: 60 + index,
    velocity: 0.84,
    durationMs: 180,
  };
}

describe("physical wall-score routing", () => {
  const events = [note(0, 0), note(1, 1_000), note(2, 4_000), note(3, 4_300)];
  const course = buildMarbleCourse(events, settings, WIDTH);

  it("moves to a distant instrument column on a level supporting rail", () => {
    const start = course[0];
    const end = course[1];
    const path = longGapRailPoints(start, end, 12);
    const support = longGapRailSupportPoints(start, end, settings.ballSize, 12);

    expect(start.longRouteKind).toBe("horizontal-rail");
    expect(start.longRail).toBe(true);
    expect(start.longTube).not.toBe(true);
    expect(Math.abs(end.hitX - start.hitX)).toBeGreaterThanOrEqual(240);
    expect(end.hitY).toBeCloseTo(start.hitY, 6);
    expect(path.every((point) => Math.abs(point.y - start.hitY) < 1e-6)).toBe(true);
    expect(support.every((point) => point.y > start.hitY)).toBe(true);
    expect(support.every((point) => Math.abs(point.y - start.hitY - settings.ballSize) < 1e-6)).toBe(true);
    expect(Math.abs(support[0].x - start.hitX)).toBeLessThan(settings.ballSize);
    expect(Math.abs(support.at(-1)!.x - end.hitX)).toBeLessThan(settings.ballSize);
  });

  it("uses a vertical pipe instead of tilting a rail for an extra-long gap", () => {
    const start = course[1];
    const end = course[2];
    const geometry = longGapTubeGeometry(start, end, settings);
    const points = Array.from({ length: 17 }, (_, index) => (
      longGapTubePoint(geometry, index / 16)
    ));

    expect(start.longRouteKind).toBe("vertical-pipe");
    expect(start.longTube).toBe(true);
    expect(start.longRail).not.toBe(true);
    expect(end.hitX).toBeCloseTo(start.hitX, 6);
    expect(end.hitY).toBeGreaterThan(start.hitY + 500);
    expect(geometry.entryY).toBeLessThan(start.hitY);
    expect(end.hitY - geometry.exitY).toBeLessThan(settings.ballSize * 5);
    expect(points.every((point) => Math.abs(point.x - start.hitX) < 1e-6)).toBe(true);
    expect(points.every((point, index) => index === 0 || point.y > points[index - 1].y)).toBe(true);
    expect(isAutomaticLongGapTubeSegment(start, end, settings)).toBe(true);
  });

  it("places both 3D rail strands below the marble and separates them in depth", () => {
    const [group] = automaticLongGapRailGroups3D(course, settings, 0);
    const marbleWorldY = -course[0].hitY * 0.01;

    expect(group.offsetAxis).toBe("depth");
    expect(group.halfGap).toBeGreaterThan(0);
    expect(group.points.every((point) => point.y < marbleWorldY)).toBe(true);
  });

  it("stays on each guide and reaches both MIDI beats exactly", () => {
    const railMid = marbleAtTime(500, events, course, settings);
    const pipeMid = marbleAtTime(2_500, events, course, settings);

    expect(railMid.y).toBeCloseTo(course[0].hitY, 6);
    expect(pipeMid.x).toBeCloseTo(course[1].hitX, 6);
    expect(marbleAtTime(1_000, events, course, settings)).toMatchObject({
      x: course[1].hitX,
      y: course[1].hitY,
    });
    expect(marbleAtTime(4_000, events, course, settings)).toMatchObject({
      x: course[2].hitX,
      y: course[2].hitY,
    });
  });
});
