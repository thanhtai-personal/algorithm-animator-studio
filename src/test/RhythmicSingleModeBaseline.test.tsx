import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicMarble3D } from "../features/rhythmic-studio/components/RhythmicMarble3D";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildMarbleCourse, marbleAtTime } from "../features/rhythmic-studio/lib/marbleCourse";
import { drawPresetMarble } from "../features/rhythmic-studio/lib/presetMarbleRenderer";
import type { NoteEvent } from "../features/rhythmic-studio/types";

const events: NoteEvent[] = [
  { id: "single-0", timeMs: 0, midi: 60, velocity: 0.82, durationMs: 220 },
  { id: "single-1", timeMs: 480, midi: 64, velocity: 0.78, durationMs: 180 },
  { id: "single-2", timeMs: 480, midi: 67, velocity: 0.74, durationMs: 180 },
  { id: "single-3", timeMs: 720, midi: 69, velocity: 0.84, durationMs: 110 },
  { id: "single-4", timeMs: 840, midi: 71, velocity: 0.86, durationMs: 100 },
  { id: "single-5", timeMs: 960, midi: 72, velocity: 0.88, durationMs: 100 },
  { id: "single-6", timeMs: 1_520, midi: 74, velocity: 0.8, durationMs: 240 },
];

const settings = {
  ...DEFAULT_SETTINGS,
  terrainProfile: "balanced" as const,
  cameraProfile: "follow" as const,
  instrumentFamily: "auto" as const,
};

function rounded(value: number) {
  return Number(value.toFixed(3));
}

describe("one-marble compatibility baseline", () => {
  it("keeps the established sparse, chord, dense-run and terminal course fingerprint", () => {
    const platforms = buildMarbleCourse(events, settings, 720);
    const platformFingerprint = platforms.map((platform) => [
      platform.event.id,
      rounded(platform.hitX),
      rounded(platform.hitY),
      rounded(platform.outVX),
      rounded(platform.outVY),
      rounded(platform.normalX),
      rounded(platform.normalY),
      platform.motionMode,
      platform.denseLayout ?? null,
      platform.visualStyle,
      platform.chordClusterId ?? null,
    ]);
    const sampleFingerprint = [0, 240, 480, 600, 720, 840, 960, 1_240, 1_520].map((timeMs) => {
      const point = marbleAtTime(timeMs, events, platforms, settings);
      return [timeMs, rounded(point.x), rounded(point.y), point.platformIndex];
    });

    expect(platformFingerprint).toEqual([
      ["single-0", 360, 220, -154.716, -129.493, -0.333, -0.943, "ballistic", null, undefined, null],
      ["single-1", 285.736, 272.809, -154.716, 349.529, 0, -1, "hold", "parallel-rails", "instrument-pad", 0],
      ["single-2", 285.736, 272.809, -141.667, 19.833, -0.139, -0.99, "roll", null, "instrument-pad", 0],
      ["single-3", 251.736, 277.569, -145, 20.3, -0.139, -0.99, "roll", "parallel-rails", "piano-key", null],
      ["single-4", 234.336, 280.005, -146.414, 20.498, -0.139, -0.99, "roll", "parallel-rails", "piano-key", null],
      ["single-5", 216.767, 282.464, -146.414, 20.498, -0.139, -0.99, "ballistic", "parallel-rails", "piano-key", null],
      ["single-6", 134.775, 450.424, 336.164, -169.67, 0.548, -0.836, "ballistic", null, undefined, null],
    ]);
    expect(sampleFingerprint).toEqual([
      [0, 360, 220, 0],
      [240, 322.868, 217.663, 0],
      [480, 285.736, 272.809, 2],
      [600, 268.736, 275.189, 2],
      [720, 251.736, 277.569, 3],
      [840, 234.336, 280.005, 4],
      [960, 216.767, 282.464, 5],
      [1_240, 175.771, 327.324, 5],
      [1_520, 134.775, 450.424, 6],
    ]);
  });

  it("draws one Canvas marble and instantiates one WebGL marble", () => {
    const gradient = { addColorStop: vi.fn() };
    const method = () => vi.fn();
    const context = {
      save: method(), restore: method(), translate: method(), rotate: method(), scale: method(),
      beginPath: method(), arc: method(), ellipse: method(), fill: method(), stroke: method(), clip: method(),
      fillRect: method(), moveTo: method(), lineTo: method(), closePath: method(),
      createRadialGradient: vi.fn(() => gradient), createLinearGradient: vi.fn(() => gradient),
    } as unknown as CanvasRenderingContext2D;
    drawPresetMarble(context, { x: 80, y: 120, color: "#42d9ff", platformIndex: 0 }, 0, 0, {
      ...settings,
      glowAnimation: false,
    });
    expect(context.arc).toHaveBeenCalledTimes(3);

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const webgl = render(<RhythmicMarble3D settings={{ ...settings, glowAnimation: false }} />);
    consoleError.mockRestore();
    expect(webgl.container.querySelectorAll("spheregeometry")).toHaveLength(1);
  });
});
