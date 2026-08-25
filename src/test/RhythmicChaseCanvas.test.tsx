import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildChaseCourse } from "../features/rhythmic-studio/lib/chaseCourse";
import {
  chaseFocusAtTime,
  drawChasePerformers2D,
} from "../features/rhythmic-studio/lib/chaseFrameRenderer2D";
import { drawPresetMarble } from "../features/rhythmic-studio/lib/presetMarbleRenderer";
import type { NoteEvent } from "../features/rhythmic-studio/types";

vi.mock("../features/rhythmic-studio/lib/marbleAvatarRenderer2D", () => ({
  drawMarbleAvatar2D: vi.fn(() => false),
}));
vi.mock("../features/rhythmic-studio/lib/presetMarbleRenderer", () => ({
  drawPresetMarble: vi.fn(),
}));

const events: NoteEvent[] = [
  { id: "canvas-0", timeMs: 0, midi: 60, velocity: 0.8, durationMs: 100 },
  { id: "canvas-1", timeMs: 180, midi: 64, velocity: 0.82, durationMs: 100 },
  { id: "canvas-2", timeMs: 360, midi: 67, velocity: 0.84, durationMs: 100 },
  { id: "canvas-3", timeMs: 540, midi: 72, velocity: 0.86, durationMs: 100 },
];
const settings = {
  ...DEFAULT_SETTINGS,
  marbleMode: "chase" as const,
  ballStyle: "striped" as const,
  secondaryMarble: { ...DEFAULT_SETTINGS.secondaryMarble, ballStyle: "multicolor-glass" as const },
};

describe("Canvas chase performers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("draws exactly two independently styled performers", () => {
    const plan = buildChaseCourse(events, settings, 720);
    drawChasePerformers2D({
      ctx: {} as CanvasRenderingContext2D,
      timeMs: 240,
      durationMs: 540,
      cameraY: 0,
      settings,
      plan,
      quality: "idle",
    });

    expect(drawPresetMarble).toHaveBeenCalledTimes(2);
    expect(vi.mocked(drawPresetMarble).mock.calls.map((call) => call[4].ballStyle)).toEqual([
      "striped",
      "multicolor-glass",
    ]);
  });

  it("focuses on the bounded midpoint of both performers", () => {
    const plan = buildChaseCourse(events, settings, 720);
    const focus = chaseFocusAtTime(270, plan, settings);
    const a = plan.tracks.A.lane;
    const b = plan.tracks.B.lane;

    expect(focus.x).toBeGreaterThan(a.offsetX);
    expect(focus.x).toBeLessThan(b.offsetX + b.width);
    expect(Number.isFinite(focus.y)).toBe(true);
  });
});
