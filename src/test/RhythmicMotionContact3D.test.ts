import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse } from "../features/rhythmic-studio/lib/marbleCourse";
import { visualMarbleAtTime } from "../features/rhythmic-studio/components/RhythmicMotion3D";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const events: NoteEvent[] = [
  { id: "a", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 180 },
  { id: "b", timeMs: 520, midi: 64, velocity: 0.8, durationMs: 180 },
];

describe("3D marble playing-face clearance", () => {
  it("lifts the marble toward the camera at both inclined key contacts", () => {
    const settings = { ...DEFAULT_SETTINGS, instrumentFamily: "piano" as const };
    const platforms = buildMarbleCourse(events, settings, 720);
    platforms.forEach((platform) => { platform.visualStyle = "piano-key"; });

    const first = visualMarbleAtTime(0, events, platforms, settings, []);
    const second = visualMarbleAtTime(520, events, platforms, settings, []);

    expect(first.z).toBeGreaterThan(0.05);
    expect(second.z).toBeGreaterThan(0.05);
  });
});
