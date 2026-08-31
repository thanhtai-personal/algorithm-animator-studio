import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse, marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import {
  terminalMarbleGoalForCourse,
  terminalMarbleGoalPoint,
} from "../features/rhythmic-studio/lib/terminalMarbleGoal";
import { presetById } from "../features/rhythmic-studio/lib/studioPresets";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const settings = {
  ...DEFAULT_SETTINGS,
  ...presetById("mixed-instruments").settings,
};

const events: NoteEvent[] = [
  { id: "goal-0", timeMs: 0, midi: 60, velocity: 0.82, durationMs: 180 },
  { id: "goal-1", timeMs: 420, midi: 64, velocity: 0.82, durationMs: 3_600 },
];

describe("mixed-instrument terminal marble goal", () => {
  const platforms = buildMarbleCourse(events, settings, 720);
  const last = platforms.at(-1)!;
  const goal = terminalMarbleGoalForCourse(platforms, settings, 720)!;

  it("places a visible destination well below the final instrument and inside the stage", () => {
    expect(goal).toBeDefined();
    expect(last.outVX * (360 - last.hitX)).toBeGreaterThan(0);
    expect(goal.bottomY - last.hitY).toBeGreaterThanOrEqual(300);
    expect(goal.centerX - goal.mouthWidth / 2).toBeGreaterThanOrEqual(48);
    expect(goal.centerX + goal.mouthWidth / 2).toBeLessThanOrEqual(672);
    expect(goal.entryTimeMs).toBeGreaterThan(700);
    expect(goal.settleTimeMs).toBeLessThan(1_800);
  });

  it("keeps the final flight continuous, lands in the goal, then settles", () => {
    const lastTimeMs = events.at(-1)!.timeMs;
    const entry = terminalMarbleGoalPoint(goal, goal.entryTimeMs);
    const atEntry = marbleAtTime(lastTimeMs + goal.entryTimeMs, events, platforms, settings);
    const atSettle = marbleAtTime(lastTimeMs + goal.settleTimeMs, events, platforms, settings);
    const afterSettle = marbleAtTime(lastTimeMs + goal.settleTimeMs + 1_200, events, platforms, settings);

    expect(atEntry.x).toBeCloseTo(entry.x, 6);
    expect(atEntry.y).toBeCloseTo(entry.y, 6);
    expect(atSettle.x).toBeCloseTo(goal.restX, 6);
    expect(atSettle.y).toBeCloseTo(goal.bottomY, 6);
    expect(afterSettle).toMatchObject({ x: goal.restX, y: goal.bottomY });

    const samples = Array.from({ length: Math.ceil(goal.settleTimeMs / (1_000 / 60)) + 1 }, (_, index) => (
      marbleAtTime(lastTimeMs + index * (1_000 / 60), events, platforms, settings)
    ));
    const frameSteps = samples.slice(1).map((point, index) => (
      Math.hypot(point.x - samples[index].x, point.y - samples[index].y)
    ));
    expect(Math.max(...frameSteps)).toBeLessThan(24);
  });

  it("does not add the finale catcher to unrelated presets", () => {
    const unrelatedPlatforms = buildMarbleCourse(events, DEFAULT_SETTINGS, 720);
    expect(terminalMarbleGoalForCourse(unrelatedPlatforms, DEFAULT_SETTINGS, 720)).toBeNull();
  });

  it("keeps the goal active when the final renderer resolves a concrete instrument family", () => {
    const finalInstrumentSettings = { ...settings, instrumentFamily: "trumpet" as const };
    const resolvedGoal = terminalMarbleGoalForCourse(platforms, finalInstrumentSettings, 720)!;
    const settled = marbleAtTime(
      events.at(-1)!.timeMs + resolvedGoal.settleTimeMs,
      events,
      platforms,
      finalInstrumentSettings,
    );

    expect(settled).toMatchObject({ x: resolvedGoal.restX, y: resolvedGoal.bottomY });
  });
});
