import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { emitDueRhythmicHits } from "../features/rhythmic-studio/lib/chaseAudioScheduler";
import { buildChaseCourse } from "../features/rhythmic-studio/lib/chaseCourse";
import type { InstrumentHitEvent, NoteEvent } from "../features/rhythmic-studio/types";

const events: NoteEvent[] = [
  { id: "audio-0", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 100 },
  { id: "audio-1", timeMs: 9, midi: 64, velocity: 0.78, durationMs: 100 },
  { id: "audio-2", timeMs: 140, midi: 67, velocity: 0.84, durationMs: 100 },
  { id: "audio-3", timeMs: 280, midi: 69, velocity: 0.86, durationMs: 100 },
];
const settings = { ...DEFAULT_SETTINGS, marbleMode: "chase" as const };

describe("chase audio source queue", () => {
  it("emits every original event exactly once across successive frames", () => {
    const plan = buildChaseCourse(events, settings, 720);
    const hits: InstrumentHitEvent[] = [];
    let nextIndex = 0;
    for (const timeMs of [0, 10, 160, 300, 600]) {
      nextIndex = emitDueRhythmicHits({
        nextIndex,
        timeMs,
        events,
        platforms: plan.platforms,
        resolveSettings: () => settings,
        courseOverrides: [],
        onNote: (hit) => hits.push(hit),
      });
    }

    expect(nextIndex).toBe(events.length);
    expect(hits.map((hit) => hit.event.id)).toEqual(events.map((event) => event.id));
    expect(new Set(hits.map((hit) => hit.event.id)).size).toBe(events.length);
  });
});
