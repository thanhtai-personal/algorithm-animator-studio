import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { RhythmicChaseMarbles3D } from "../features/rhythmic-studio/components/RhythmicChaseMarbles3D";
import {
  visualChaseFocusAtTime,
  visualChaseMarbleAtTime,
} from "../features/rhythmic-studio/components/RhythmicMotion3D";
import { buildChaseCourse, chaseMarbleAtTime } from "../features/rhythmic-studio/lib/chaseCourse";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const events: NoteEvent[] = [
  { id: "webgl-0", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 100 },
  { id: "webgl-1", timeMs: 180, midi: 64, velocity: 0.82, durationMs: 100 },
  { id: "webgl-2", timeMs: 360, midi: 67, velocity: 0.84, durationMs: 100 },
  { id: "webgl-3", timeMs: 540, midi: 72, velocity: 0.86, durationMs: 100 },
];
const settings = {
  ...DEFAULT_SETTINGS,
  marbleMode: "chase" as const,
  ballStyle: "striped" as const,
  secondaryMarble: { ...DEFAULT_SETTINGS.secondaryMarble, ballStyle: "multicolor-glass" as const },
};

describe("WebGL chase performers", () => {
  it("instantiates one independently styled marble for each owner", () => {
    const plan = buildChaseCourse(events, settings, 720);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const view = render(<RhythmicChaseMarbles3D plan={plan} settings={settings} />);
    consoleError.mockRestore();

    const performers = Array.from(view.container.querySelectorAll("group[name^='chase-marble-']"));
    expect(performers).toHaveLength(2);
    expect(performers.map((node) => node.getAttribute("name"))).toEqual([
      "chase-marble-A-striped",
      "chase-marble-B-multicolor-glass",
    ]);
    expect(view.container.querySelector("group[name='multicolor-glass-core']")).not.toBeNull();
  });

  it("matches Canvas positions and keeps top-face contact depth", () => {
    const plan = buildChaseCourse(events, settings, 720);
    plan.platforms.forEach((platform) => { platform.visualStyle = "drum-disc"; });
    for (const eventIndex of [0, 1, 2, 3]) {
      const owner = plan.ownership.ownerByEventIndex[eventIndex];
      const canvasPoint = chaseMarbleAtTime(owner, events[eventIndex].timeMs, plan, settings);
      const webglPoint = visualChaseMarbleAtTime(owner, events[eventIndex].timeMs, plan, settings);
      expect(webglPoint.x).toBeCloseTo(canvasPoint.x, 6);
      expect(webglPoint.y).toBeCloseTo(canvasPoint.y, 6);
      expect(webglPoint.z).toBeGreaterThan(0.05);
      expect(webglPoint.platformIndex).toBe(eventIndex);
    }
  });

  it("uses the two-performer midpoint as its camera focus", () => {
    const plan = buildChaseCourse(events, settings, 720);
    const focus = visualChaseFocusAtTime(270, plan, settings);
    const a = visualChaseMarbleAtTime("A", 270, plan, settings);
    const b = visualChaseMarbleAtTime("B", 270, plan, settings);

    expect(focus.x).toBeCloseTo((a.x + b.x) / 2, 8);
    expect(focus.y).toBeCloseTo((a.y + b.y) / 2, 8);
    expect(focus.z).toBeCloseTo((a.z + b.z) / 2, 8);
  });
});
