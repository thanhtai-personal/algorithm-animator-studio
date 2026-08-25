import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  buildChaseCourse,
  chaseMarbleAtTime,
} from "../features/rhythmic-studio/lib/chaseCourse";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function note(index: number, timeMs: number): NoteEvent {
  return { id: `chase-${index}`, timeMs, midi: 60 + (index % 12), velocity: 0.82, durationMs: 100 };
}

const events = [
  note(0, 0), note(1, 8), note(2, 120), note(3, 240), note(4, 360),
  note(5, 480), note(6, 600), note(7, 720), note(8, 840), note(9, 1_520),
  note(10, 1_920), note(11, 2_320),
];
const settings = {
  ...DEFAULT_SETTINGS,
  marbleMode: "chase" as const,
  terrainProfile: "balanced" as const,
  cameraProfile: "follow" as const,
  instrumentFamily: "auto" as const,
};

describe("two-marble physical course", () => {
  it("builds two continuous tracks and one platform per original event", () => {
    const plan = buildChaseCourse(events, settings, 720);

    expect(plan.tracks.A.events.length + plan.tracks.B.events.length).toBe(events.length);
    expect(plan.platforms.map((platform) => platform.event.id)).toEqual(events.map((event) => event.id));
    expect(plan.tracks.A.eventIndices).toEqual([0, 1, 3, 5, 7, 9, 11]);
    expect(plan.tracks.B.eventIndices).toEqual([2, 4, 6, 8, 10]);
  });

  it("puts the owning marble on every exact MIDI endpoint without crossing lanes", () => {
    const plan = buildChaseCourse(events, settings, 720);

    events.forEach((event, eventIndex) => {
      const owner = plan.ownership.ownerByEventIndex[eventIndex];
      const point = chaseMarbleAtTime(owner, event.timeMs, plan, settings);
      const platform = plan.platforms[eventIndex];
      expect(Math.hypot(point.x - platform.hitX, point.y - platform.hitY), event.id).toBeLessThan(0.01);
      expect(owner === "A" ? platform.hitX : 720 - platform.hitX).toBeLessThan(360);
    });
  });

  it("keeps every visible face upward and leaves ballistic strikes immediately", () => {
    const plan = buildChaseCourse(events, settings, 720);

    expect(plan.platforms.filter((platform) => !platform.visualHidden).every((platform) => platform.normalY < -0.2)).toBe(true);
    for (const owner of ["A", "B"] as const) {
      const track = plan.tracks[owner];
      for (let index = 0; index < track.platforms.length - 1; index += 1) {
        const platform = track.platforms[index];
        if (platform.motionMode !== "ballistic") continue;
        const point = chaseMarbleAtTime(owner, track.events[index].timeMs + 1_000 / 60, plan, settings);
        const separation = (point.x - platform.hitX) * platform.normalX
          + (point.y - platform.hitY) * platform.normalY;
        expect(separation, `${owner}:${index}`).toBeGreaterThan(0.2);
      }
    }
  });

  it("keeps dense instruments inside two compact corridors", () => {
    const plan = buildChaseCourse(events, settings, 720);
    const aRight = Math.max(...plan.tracks.A.platforms.map((platform) => (platform.visualX ?? platform.x) + (platform.visualWidth ?? platform.width) / 2));
    const bLeft = Math.min(...plan.tracks.B.platforms.map((platform) => (platform.visualX ?? platform.x) - (platform.visualWidth ?? platform.width) / 2));

    expect(aRight).toBeLessThanOrEqual(bLeft + 1);
    expect(new Set(plan.ownership.ownerByEventIndex)).toEqual(new Set(["A", "B"]));
    expect(plan.phrases.every((phrase) => phrase.layout !== undefined)).toBe(true);
  });
});
