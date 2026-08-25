import { describe, expect, it } from "vitest";
import { assignChaseStrikeOwnership } from "../features/rhythmic-studio/engine/chaseStrikeOwnership";
import type { NoteEvent } from "../features/rhythmic-studio/types";

function event(id: string, timeMs: number, midi: number): NoteEvent {
  return { id, timeMs, midi, velocity: 0.8, durationMs: 120 };
}

const events = [
  event("c4", 0, 60),
  event("e4", 8, 64),
  event("g4", 120, 67),
  event("a4", 240, 69),
  event("c5", 252, 72),
  event("d5", 480, 74),
];

describe("alternating chase strike ownership", () => {
  it("alternates complete onset clusters without splitting a chord", () => {
    const plan = assignChaseStrikeOwnership(events, "chase");

    expect(plan.strikes.map((strike) => ({
      owner: strike.owner,
      eventIds: strike.eventIds,
      timeMs: strike.timeMs,
    }))).toEqual([
      { owner: "A", eventIds: ["c4", "e4"], timeMs: 0 },
      { owner: "B", eventIds: ["g4"], timeMs: 120 },
      { owner: "A", eventIds: ["a4", "c5"], timeMs: 240 },
      { owner: "B", eventIds: ["d5"], timeMs: 480 },
    ]);
    expect(plan.ownerByEventIndex).toEqual(["A", "A", "B", "A", "A", "B"]);
  });

  it("preserves every source event identity, timestamp and order exactly once", () => {
    const plan = assignChaseStrikeOwnership(events, "chase");
    const assignedIds = plan.strikes.flatMap((strike) => strike.eventIds);

    expect(assignedIds).toEqual(events.map((note) => note.id));
    expect(new Set(assignedIds).size).toBe(events.length);
    for (const strike of plan.strikes) {
      for (let index = strike.startIndex; index <= strike.endIndex; index += 1) {
        expect(events[index].timeMs).toBeGreaterThanOrEqual(strike.timeMs);
        expect(plan.strikeIndexByEventIndex[index]).toBe(strike.index);
      }
    }
  });

  it("leaves single mode ungrouped and owned only by marble A", () => {
    const plan = assignChaseStrikeOwnership(events, "single");

    expect(plan.strikes).toHaveLength(events.length);
    expect(plan.ownerByEventIndex).toEqual(events.map(() => "A"));
    expect(plan.strikes.every((strike) => strike.startIndex === strike.endIndex)).toBe(true);
    expect(plan.strikes.map((strike) => strike.eventIds[0])).toEqual(events.map((note) => note.id));
  });

  it("returns an empty serializable plan for an empty timeline", () => {
    expect(assignChaseStrikeOwnership([], "chase")).toEqual({
      strikes: [],
      ownerByEventIndex: [],
      strikeIndexByEventIndex: [],
    });
  });
});
