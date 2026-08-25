import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { prepareMarbleCourse } from "../features/rhythmic-studio/engine/marbleCoursePreparation";
import {
  chaseMarbleAtTime,
  chaseTrackMarbleAtTime,
} from "../features/rhythmic-studio/lib/chaseCourse";
import { marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import { parseMidi } from "../features/rhythmic-studio/lib/midiParser";
import { buildRhythmicTimeline } from "../features/rhythmic-studio/lib/timeline";
import { visualChaseMarbleAtTime } from "../features/rhythmic-studio/components/RhythmicMotion3D";

const BABY_SHARK_PATH = "C:\\Users\\Kai.Tran\\Music\\midi\\Pinkfong-Babyshark.mid";
const bytes = readFileSync(BABY_SHARK_PATH);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const sourceEvents = parseMidi(buffer);
const baseSettings = {
  ...DEFAULT_SETTINGS,
  terrainProfile: "balanced" as const,
  cameraProfile: "follow" as const,
  instrumentFamily: "auto" as const,
};
const events = buildRhythmicTimeline(sourceEvents, baseSettings);

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("exact Pinkfong Baby Shark chase regression", () => {
  it("keeps the existing single-mode course and launches away from the final instrument", () => {
    const settings = { ...baseSettings, marbleMode: "single" as const };
    const result = prepareMarbleCourse({
      events,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 1,
    });

    expect(sourceEvents).toHaveLength(1_086);
    expect(events).toHaveLength(355);
    expect(result.mode).toBe("single");
    expect(result.platforms.map((platform) => platform.event.id)).toEqual(events.map((event) => event.id));
    expect(result.platforms.filter((platform) => !platform.visualHidden).every((platform) => platform.normalY < -0.2)).toBe(true);
    const lastTime = events.at(-1)?.timeMs ?? 0;
    const atImpact = marbleAtTime(lastTime, events, result.platforms, settings);
    const afterImpact = marbleAtTime(lastTime + 1_000 / 60, events, result.platforms, settings);
    expect(distance(afterImpact, atImpact)).toBeGreaterThan(0.2);
  }, 30_000);

  it("preserves every source event exactly once and alternates complete strikes", () => {
    const settings = { ...baseSettings, marbleMode: "chase" as const };
    const result = prepareMarbleCourse({
      events,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 1,
    });
    const plan = result.chasePlan;
    expect(plan).not.toBeNull();
    if (!plan) return;

    expect(plan.platforms.map((platform) => platform.event.id)).toEqual(events.map((event) => event.id));
    expect(new Set(plan.platforms.map((platform) => platform.event.id)).size).toBe(events.length);
    expect(plan.ownership.strikes.every((strike, index) => strike.owner === (index % 2 ? "B" : "A"))).toBe(true);
    expect(plan.ownership.strikes.every((strike) => (
      new Set(plan.ownership.ownerByEventIndex.slice(strike.startIndex, strike.endIndex + 1)).size === 1
    ))).toBe(true);
    expect(plan.platforms.filter((platform) => !platform.visualHidden).every((platform) => platform.normalY < -0.2)).toBe(true);
  }, 30_000);

  it("has exact contacts, immediate release, bounded travel and Canvas/WebGL parity", () => {
    const settings = { ...baseSettings, marbleMode: "chase" as const };
    const plan = prepareMarbleCourse({
      events,
      settings,
      width: 720,
      presetMixEnabled: false,
      presetMixSeed: 1,
    }).chasePlan;
    expect(plan).not.toBeNull();
    if (!plan) return;

    let maxFrameTravel = 0;
    events.forEach((event, eventIndex) => {
      const owner = plan.ownership.ownerByEventIndex[eventIndex];
      const point = chaseMarbleAtTime(owner, event.timeMs, plan, settings);
      const platform = plan.platforms[eventIndex];
      expect(distance(point, { x: platform.hitX, y: platform.hitY }), event.id).toBeLessThan(0.02);
      const after = chaseMarbleAtTime(owner, event.timeMs + 1_000 / 60, plan, settings);
      maxFrameTravel = Math.max(maxFrameTravel, distance(point, after));
    });
    expect(maxFrameTravel).toBeLessThan(80);

    for (const owner of ["A", "B"] as const) {
      const track = plan.tracks[owner];
      for (let index = 0; index < track.platforms.length - 1; index += 1) {
        const platform = track.platforms[index];
        if (platform.motionMode !== "ballistic") continue;
        const after = chaseTrackMarbleAtTime(owner, track.events[index].timeMs + 1_000 / 60, plan, settings);
        const separation = (after.x - platform.hitX) * platform.normalX
          + (after.y - platform.hitY) * platform.normalY;
        expect(separation, `${owner}:${index}`).toBeGreaterThan(0.2);
      }
      const lastTime = track.events.at(-1)?.timeMs ?? 0;
      const atImpact = chaseTrackMarbleAtTime(owner, lastTime, plan, settings);
      const afterImpact = chaseTrackMarbleAtTime(owner, lastTime + 1_000 / 60, plan, settings);
      expect(distance(afterImpact, atImpact), `${owner}:terminal`).toBeGreaterThan(0.2);
    }

    for (let index = 0; index < events.length; index += 17) {
      const owner = plan.ownership.ownerByEventIndex[index];
      const canvas = chaseMarbleAtTime(owner, events[index].timeMs, plan, settings);
      const webgl = visualChaseMarbleAtTime(owner, events[index].timeMs, plan, settings);
      expect(webgl.x).toBeCloseTo(canvas.x, 6);
      expect(webgl.y).toBeCloseTo(canvas.y, 6);
    }
  }, 30_000);
});
