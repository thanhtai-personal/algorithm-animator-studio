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
import {
  WALL_SCORE_VERTICAL_PIPE_SPEED,
  wallScoreLongRouteGuideWindow,
} from "../features/rhythmic-studio/lib/wallScoreMotion";
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

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("physical wall-score routing", () => {
  const events = [note(0, 0), note(1, 1_000), note(2, 4_000), note(3, 4_300)];
  const course = buildMarbleCourse(events, settings, WIDTH);

  it("uses a detached, gently curved horizontal rail between distant instrument columns", () => {
    const start = course[0];
    const end = course[1];
    const path = longGapRailPoints(start, end, 12);
    const support = longGapRailSupportPoints(start, end, settings.ballSize, 12);
    const yValues = path.map((point) => point.y);

    expect(start.longRouteKind).toBe("horizontal-rail");
    expect(start.longRail).toBe(true);
    expect(start.longTube).not.toBe(true);
    expect(Math.abs(end.hitX - start.hitX)).toBeGreaterThanOrEqual(240);
    expect(end.hitY).toBeCloseTo(start.hitY, 6);

    // The rail catches the ball after launch and releases it before the next hit.
    expect(distance(path[0], { x: start.hitX, y: start.hitY })).toBeGreaterThan(settings.ballSize * 2);
    expect(distance(path.at(-1)!, { x: end.hitX, y: end.hitY })).toBeGreaterThan(settings.ballSize * 2);

    // It remains predominantly horizontal, but is not an artificial ruler-straight line.
    expect(Math.max(...yValues) - Math.min(...yValues)).toBeGreaterThan(2);
    expect(Math.max(...yValues) - Math.min(...yValues)).toBeLessThan(Math.abs(end.hitX - start.hitX) * 0.25);

    // The physical support follows the curve one ball radius below the marble path.
    support.forEach((point, index) => {
      expect(distance(point, path[index])).toBeCloseTo(settings.ballSize, 5);
      expect(point.y).toBeGreaterThanOrEqual(path[index].y);
    });
  });

  it("uses a detached S-curve pipe instead of tilting a rail for an extra-long drop", () => {
    const start = course[1];
    const end = course[2];
    const geometry = longGapTubeGeometry(start, end, settings);
    const points = Array.from({ length: 17 }, (_, index) => (
      longGapTubePoint(geometry, index / 16)
    ));
    const xValues = points.map((point) => point.x);

    expect(start.longRouteKind).toBe("vertical-pipe");
    expect(start.longTube).toBe(true);
    expect(start.longRail).not.toBe(true);
    expect(end.hitX).toBeCloseTo(start.hitX, 6);
    expect(end.hitY).toBeGreaterThan(start.hitY + 400);

    expect(distance(
      { x: geometry.entryX, y: geometry.entryY },
      { x: start.hitX, y: start.hitY },
    )).toBeGreaterThan(settings.ballSize * 1.5);
    expect(distance(
      { x: geometry.exitX, y: geometry.exitY },
      { x: end.hitX, y: end.hitY },
    )).toBeGreaterThan(settings.ballSize * 1.5);

    // A pipe can be vertical overall, but should visibly bow left/right instead of being a ruler line.
    expect(Math.max(...xValues) - Math.min(...xValues)).toBeGreaterThan(settings.ballSize * 2);
    expect(Math.max(...xValues) - Math.min(...xValues)).toBeLessThan((end.hitY - start.hitY) * 0.5);
    expect(points.every((point, index) => index === 0 || point.y > points[index - 1].y)).toBe(true);

    const densePoints = Array.from({ length: 65 }, (_, index) => longGapTubePoint(geometry, index / 64));
    const stepDistances = densePoints.slice(1).map((point, index) => distance(point, densePoints[index]));
    const pipeWindow = wallScoreLongRouteGuideWindow(end.event.timeMs - start.event.timeMs, "vertical-pipe");
    const guideSeconds = (end.event.timeMs - start.event.timeMs) / 1_000 * (pipeWindow.exitT - pipeWindow.entryT);
    const guideLength = stepDistances.reduce((sum, value) => sum + value, 0);
    expect(guideLength / guideSeconds).toBeGreaterThanOrEqual(WALL_SCORE_VERTICAL_PIPE_SPEED - 3);
    expect(Math.max(...stepDistances) / Math.min(...stepDistances)).toBeLessThan(1.25);
    expect(geometry.waveCount).toBeGreaterThanOrEqual(2);
    expect(isAutomaticLongGapTubeSegment(start, end, settings)).toBe(true);
  });

  it("places both 3D rail strands below the marble and separates them in depth", () => {
    const [group] = automaticLongGapRailGroups3D(course, settings, 0);
    const marbleWorldY = -course[0].hitY * 0.01;

    expect(group.offsetAxis).toBe("depth");
    expect(group.halfGap).toBeGreaterThan(0);
    expect(group.points.every((point) => point.y < marbleWorldY)).toBe(true);
  });

  it("flies into each guide, follows its middle section, then reaches the MIDI beat exactly", () => {
    const railStart = course[0];
    const railEnd = course[1];
    const railWindow = wallScoreLongRouteGuideWindow(1_000, "horizontal-rail");
    const railPath = longGapRailPoints(railStart, railEnd, 2);
    const railEntry = marbleAtTime(1_000 * railWindow.entryT, events, course, settings);
    const railMid = marbleAtTime(
      1_000 * ((railWindow.entryT + railWindow.exitT) / 2),
      events,
      course,
      settings,
    );

    const pipeStart = course[1];
    const pipeEnd = course[2];
    const pipeSpan = pipeEnd.event.timeMs - pipeStart.event.timeMs;
    const pipeWindow = wallScoreLongRouteGuideWindow(pipeSpan, "vertical-pipe");
    const pipeGeometry = longGapTubeGeometry(pipeStart, pipeEnd, settings);
    const pipeMid = marbleAtTime(
      pipeStart.event.timeMs + pipeSpan * ((pipeWindow.entryT + pipeWindow.exitT) / 2),
      events,
      course,
      settings,
    );

    expect(railEntry.x).toBeCloseTo(railPath[0].x, 5);
    expect(railEntry.y).toBeCloseTo(railPath[0].y, 5);
    expect(railMid.x).toBeCloseTo(railPath[1].x, 5);
    expect(railMid.y).toBeCloseTo(railPath[1].y, 5);
    expect(pipeMid.x).toBeCloseTo(longGapTubePoint(pipeGeometry, 0.5).x, 5);
    expect(pipeMid.y).toBeCloseTo(longGapTubePoint(pipeGeometry, 0.5).y, 5);

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
