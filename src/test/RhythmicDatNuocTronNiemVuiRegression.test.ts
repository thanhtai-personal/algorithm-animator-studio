import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { prepareMarbleCourse } from "../features/rhythmic-studio/engine/marbleCoursePreparation";
import { LONG_GAP_RAIL_MS } from "../features/rhythmic-studio/engine/longGapRailRouting";
import {
  longGapTubeGeometry,
  longGapTubePoint,
  marbleAtTime,
} from "../features/rhythmic-studio/lib/marbleCourse";
import {
  longGapRailPoints,
  longGapRailSupportPoints,
} from "../features/rhythmic-studio/lib/longGapRail";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { buildAutomaticInstrumentMix } from "../features/rhythmic-studio/lib/phraseInstrumentMix";
import {
  WALL_SCORE_VERTICAL_PIPE_SPEED,
  wallScoreLongRouteGuideWindow,
} from "../features/rhythmic-studio/lib/wallScoreMotion";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";

const MIDI_PATH = process.env.RHYTHMIC_TEST_MIDI
  ?? "C:\\Users\\Kai.Tran\\Music\\midi\\Đất Nước Trọn Niềm Vui.mid";

function prepareUserCourse() {
  const bytes = readFileSync(MIDI_PATH);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const sourceEvents = parseMidi(buffer);
  const settings = { ...DEFAULT_SETTINGS, ...presetById("mixed-instruments").settings };
  const events = buildRhythmicTimeline(sourceEvents, settings);
  const instrumentMixSegments = buildAutomaticInstrumentMix(events);
  const course = prepareMarbleCourse({
    events,
    settings,
    width: 720,
    presetMixEnabled: false,
    presetMixSeed: 1,
    instrumentMixSegments,
  });
  return { sourceEvents, settings, events, instrumentMixSegments, platforms: course.platforms };
}

const describeIfMidiAvailable = existsSync(MIDI_PATH) ? describe : describe.skip;

describeIfMidiAvailable("Đất Nước Trọn Niềm Vui.mid mixed-instrument regression", () => {
  it("keeps the imported lead melody and its MIDI-derived instrument phrases", () => {
    const { sourceEvents, events, instrumentMixSegments, platforms } = prepareUserCourse();

    expect(sourceEvents).toHaveLength(715);
    expect(events).toHaveLength(218);
    expect(platforms).toHaveLength(events.length);
    expect(instrumentMixSegments).toHaveLength(20);
    expect(new Set(instrumentMixSegments.map((segment) => segment.family)).size).toBeGreaterThanOrEqual(8);
    expect(Math.max(...instrumentMixSegments.map((segment) => segment.endMs - segment.startMs)))
      .toBeLessThan(9_001);
  });

  it("keeps the concrete instruments in two open lanes and bounces across the center", () => {
    const { events, platforms } = prepareUserCourse();
    const center = 360;
    const centerClearance = Math.min(...platforms.map((platform) => Math.abs(platform.hitX - center)));
    expect(centerClearance).toBeGreaterThan(90);

    let eligible = 0;
    let crossings = 0;
    for (let index = 1; index < platforms.length; index += 1) {
      const gapMs = events[index].timeMs - events[index - 1].timeMs;
      if (gapMs < 170 || gapMs >= LONG_GAP_RAIL_MS) continue;
      eligible += 1;
      if (Math.sign(platforms[index].hitX - center) !== Math.sign(platforms[index - 1].hitX - center)) {
        crossings += 1;
      }
    }
    expect(eligible).toBeGreaterThan(100);
    expect(crossings).toBe(eligible);
  });

  it("routes long rests across level rails or down vertical pipes", () => {
    const { settings, events, platforms } = prepareUserCourse();
    const longSegments = platforms.slice(0, -1).filter((platform, index) => (
      events[index + 1].timeMs - events[index].timeMs >= LONG_GAP_RAIL_MS
    ));
    const rails = longSegments.filter((platform) => platform.longRouteKind === "horizontal-rail");
    const pipes = longSegments.filter((platform) => platform.longRouteKind === "vertical-pipe");

    expect(longSegments).toHaveLength(34);
    expect(rails.length).toBeGreaterThan(5);
    expect(pipes.length).toBeGreaterThan(5);

    for (const start of rails) {
      const end = platforms[start.index + 1];
      const durationMs = end.event.timeMs - start.event.timeMs;
      const durationSeconds = durationMs / 1_000;
      const strikeDistance = Math.hypot(end.hitX - start.hitX, end.hitY - start.hitY);
      const rail = longGapRailPoints(start, end, 10);
      const support = longGapRailSupportPoints(start, end, settings.ballSize, 10);
      const yValues = rail.map((point) => point.y);
      const xValues = rail.map((point) => point.x);
      const window = wallScoreLongRouteGuideWindow(durationMs, "horizontal-rail");
      const railEntry = marbleAtTime(
        start.event.timeMs + durationMs * window.entryT,
        events,
        platforms,
        settings,
      );
      const afterOneFrame = marbleAtTime(
        start.event.timeMs + 1_000 / 60,
        events,
        platforms,
        settings,
      );

      expect(start.motionMode, `motion ${start.index}`).toBe("roll");
      expect(start.longRail, `rail ${start.index}`).toBe(true);
      expect(start.longTube, `not a pipe ${start.index}`).not.toBe(true);
      expect(end.hitY, `level rail ${start.index}`).toBeCloseTo(start.hitY, 6);
      expect(Math.abs(end.hitX - start.hitX), `column change ${start.index}`).toBeGreaterThanOrEqual(240);
      expect(strikeDistance / durationSeconds, `strike speed ${start.index}`).toBeGreaterThanOrEqual(225);
      expect(Math.hypot(rail[0].x - start.hitX, rail[0].y - start.hitY), `detached entry ${start.index}`)
        .toBeGreaterThan(settings.ballSize * 2);
      expect(Math.hypot(rail.at(-1)!.x - end.hitX, rail.at(-1)!.y - end.hitY), `detached exit ${start.index}`)
        .toBeGreaterThan(settings.ballSize * 2);
      expect(Math.max(...yValues) - Math.min(...yValues), `rail curve ${start.index}`).toBeGreaterThan(1);
      expect(Math.max(...yValues) - Math.min(...yValues), `mostly horizontal ${start.index}`)
        .toBeLessThan((Math.max(...xValues) - Math.min(...xValues)) * 0.35);
      support.forEach((point, index) => {
        expect(Math.hypot(point.x - rail[index].x, point.y - rail[index].y), `support radius ${start.index}:${index}`)
          .toBeCloseTo(settings.ballSize, 4);
      });
      expect(railEntry.x, `rail catch x ${start.index}`).toBeCloseTo(rail[0].x, 4);
      expect(railEntry.y, `rail catch y ${start.index}`).toBeCloseTo(rail[0].y, 4);
      expect(
        Math.hypot(afterOneFrame.x - start.hitX, afterOneFrame.y - start.hitY),
        `first-frame travel ${start.index}`,
      ).toBeGreaterThan(1.5);
    }

    for (const start of pipes) {
      const end = platforms[start.index + 1];
      const durationMs = end.event.timeMs - start.event.timeMs;
      const durationSeconds = durationMs / 1_000;
      const geometry = longGapTubeGeometry(start, end, settings);
      const pipe = Array.from({ length: 65 }, (_, index) => (
        longGapTubePoint(geometry, index / 64)
      ));
      const xValues = pipe.map((point) => point.x);
      const yValues = pipe.map((point) => point.y);

      expect(start.motionMode, `motion ${start.index}`).toBe("roll");
      expect(start.longTube, `pipe ${start.index}`).toBe(true);
      expect(start.longRail, `not a rail ${start.index}`).not.toBe(true);
      expect(end.hitX, `vertical pipe ${start.index}`).toBeCloseTo(start.hitX, 6);
      const window = wallScoreLongRouteGuideWindow(durationMs, "vertical-pipe");
      const guideSeconds = durationSeconds * (window.exitT - window.entryT);
      const pathLength = pipe.slice(1).reduce((sum, point, pointIndex) => (
        sum + Math.hypot(point.x - pipe[pointIndex].x, point.y - pipe[pointIndex].y)
      ), 0);
      expect(pathLength / guideSeconds, `pipe travel speed ${start.index}`)
        .toBeGreaterThanOrEqual(WALL_SCORE_VERTICAL_PIPE_SPEED - 4);
      expect(start.outVY, `upward pipe entry ${start.index}`).toBeLessThan(0);
      expect(Math.hypot(geometry.entryX - start.hitX, geometry.entryY - start.hitY), `detached pipe entry ${start.index}`)
        .toBeGreaterThan(settings.ballSize * 1.5);
      expect(Math.hypot(geometry.exitX - end.hitX, geometry.exitY - end.hitY), `detached pipe exit ${start.index}`)
        .toBeGreaterThan(settings.ballSize * 1.5);
      expect(Math.max(...xValues) - Math.min(...xValues), `pipe S curve ${start.index}`)
        .toBeGreaterThan(settings.ballSize * 2);
      expect(Math.max(...xValues) - Math.min(...xValues), `mostly vertical pipe ${start.index}`)
        .toBeLessThan((Math.max(...yValues) - Math.min(...yValues)) * 0.5);
      expect(pipe.every((point, index) => index === 0 || point.y > pipe[index - 1].y), `downward pipe ${start.index}`)
        .toBe(true);
    }
  });

  it("leaves every playing face immediately and still lands on the exact MIDI beat", () => {
    const { settings, events, platforms } = prepareUserCourse();

    for (let index = 0; index < platforms.length - 1; index += 1) {
      const start = platforms[index];
      const end = platforms[index + 1];
      const afterOneFrame = marbleAtTime(
        start.event.timeMs + Math.min(1_000 / 60, (end.event.timeMs - start.event.timeMs) * 0.2),
        events,
        platforms,
        settings,
      );
      const signedDeparture = (afterOneFrame.x - start.hitX) * start.normalX
        + (afterOneFrame.y - start.hitY) * start.normalY;
      const arrival = marbleAtTime(end.event.timeMs, events, platforms, settings);

      expect(signedDeparture, `post-impact separation ${index}`).toBeGreaterThan(0.2);
      expect(arrival.x, `arrival x ${index}`).toBeCloseTo(end.hitX, 5);
      expect(arrival.y, `arrival y ${index}`).toBeCloseTo(end.hitY, 5);
    }
  });
});
