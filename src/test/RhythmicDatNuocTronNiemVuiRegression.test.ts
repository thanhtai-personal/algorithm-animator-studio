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
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";

const MIDI_PATH = "C:\\Users\\Kai.Tran\\Music\\midi\\Đất Nước Trọn Niềm Vui.mid";

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
    expect(instrumentMixSegments.map((segment) => segment.family)).toEqual(["pluck", "piano"]);
  });

  it("routes long rests across level rails or down vertical pipes", () => {
    const { settings, events, platforms } = prepareUserCourse();
    const longSegments = platforms.slice(0, -1).filter((platform, index) => (
      events[index + 1].timeMs - events[index].timeMs >= LONG_GAP_RAIL_MS
    ));
    const rails = longSegments.filter((platform) => platform.longRouteKind === "horizontal-rail");
    const pipes = longSegments.filter((platform) => platform.longRouteKind === "vertical-pipe");

    expect(longSegments).toHaveLength(34);
    expect(rails).toHaveLength(23);
    expect(pipes).toHaveLength(11);

    for (const start of rails) {
      const end = platforms[start.index + 1];
      const durationSeconds = (end.event.timeMs - start.event.timeMs) / 1_000;
      const strikeDistance = Math.hypot(end.hitX - start.hitX, end.hitY - start.hitY);
      const rail = longGapRailPoints(start, end, 10);
      const support = longGapRailSupportPoints(start, end, settings.ballSize, 10);
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
      expect(rail.every((point) => Math.abs(point.y - start.hitY) < 1e-6)).toBe(true);
      expect(support.every((point) => (
        Math.abs(point.y - start.hitY - settings.ballSize) < 1e-6
      ))).toBe(true);
      expect(
        Math.hypot(afterOneFrame.x - start.hitX, afterOneFrame.y - start.hitY),
        `first-frame travel ${start.index}`,
      ).toBeGreaterThan(1.5);

      const speedAt = (phase: number) => {
        const samplePhase = 0.002;
        const beforePhase = Math.max(0, phase - samplePhase);
        const afterPhase = Math.min(1, phase + samplePhase);
        const before = marbleAtTime(
          start.event.timeMs + durationSeconds * 1_000 * beforePhase,
          events,
          platforms,
          settings,
        );
        const after = marbleAtTime(
          start.event.timeMs + durationSeconds * 1_000 * afterPhase,
          events,
          platforms,
          settings,
        );
        return Math.hypot(after.x - before.x, after.y - before.y)
          / (durationSeconds * (afterPhase - beforePhase));
      };
      const sampledSpeeds = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95].map(speedAt);
      expect(Math.min(...sampledSpeeds), `minimum rail speed ${start.index}`).toBeGreaterThan(120);
      expect(Math.max(...sampledSpeeds), `maximum rail speed ${start.index}`).toBeLessThan(500);
      expect(speedAt(0.5), `rail braking ${start.index}`).toBeGreaterThan(speedAt(0.95));
    }

    for (const start of pipes) {
      const end = platforms[start.index + 1];
      const durationSeconds = (end.event.timeMs - start.event.timeMs) / 1_000;
      const geometry = longGapTubeGeometry(start, end, settings);
      const pipe = Array.from({ length: 17 }, (_, index) => (
        longGapTubePoint(geometry, index / 16)
      ));

      expect(start.motionMode, `motion ${start.index}`).toBe("roll");
      expect(start.longTube, `pipe ${start.index}`).toBe(true);
      expect(start.longRail, `not a rail ${start.index}`).not.toBe(true);
      expect(end.hitX, `vertical pipe ${start.index}`).toBeCloseTo(start.hitX, 6);
      expect((end.hitY - start.hitY) / durationSeconds, `pipe speed ${start.index}`)
        .toBeCloseTo(180, 5);
      expect(start.outVY, `upward pipe entry ${start.index}`).toBeLessThan(0);
      expect(start.outVY + start.gravity * durationSeconds, `downward pipe exit ${start.index}`)
        .toBeGreaterThan(0);
      expect(pipe.every((point) => Math.abs(point.x - start.hitX) < 1e-6)).toBe(true);
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
