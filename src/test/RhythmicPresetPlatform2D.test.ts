import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";
import { drawPresetPlatform } from "../features/rhythmic-studio/lib/presetPlatformRenderer";

function strictCanvasContext() {
  const gradient = { addColorStop: vi.fn() };
  const arc = vi.fn();
  const context = {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    arc,
    arcTo: vi.fn((_x1: number, _y1: number, _x2: number, _y2: number, radius: number) => {
      if (radius < 0) throw new DOMException("The radius provided is negative.", "IndexSizeError");
    }),
  } as unknown as CanvasRenderingContext2D;
  return { arc, context };
}

describe("2D preset platform renderer", () => {
  it("renders a narrow instrument key without passing a negative corner radius to Canvas", () => {
    const { context } = strictCanvasContext();
    const platform = {
      width: 11.52,
      thickness: 6,
      color: "#f59e0b",
    } as MarblePlatform;

    expect(() => drawPresetPlatform(
      context,
      "instrument-key",
      platform.width / 2,
      platform,
      0,
      0,
      DEFAULT_SETTINGS,
    )).not.toThrow();
  });

  it("keeps the key bolts inside a narrow instrument face", () => {
    const { arc, context } = strictCanvasContext();
    const platform = {
      width: 11.52,
      thickness: 6,
      color: "#f59e0b",
    } as MarblePlatform;

    drawPresetPlatform(context, "instrument-key", platform.width / 2, platform, 0, 0, DEFAULT_SETTINGS);

    expect(arc.mock.calls.every(([x]) => Math.abs(x) <= platform.width / 2)).toBe(true);
  });
});
