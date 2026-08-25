import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { buildBrickPattern } from "../features/rhythmic-studio/lib/brickWallPattern";
import { BACKGROUND_PRESETS } from "../features/rhythmic-studio/types";

describe("rhythmic brick wall background", () => {
  it("uses a staggered running-bond layout with deterministic surface variation", () => {
    const first = buildBrickPattern(360, 596, 90, 36);
    const second = buildBrickPattern(360, 596, 90, 36);
    const even = first.find((brick) => brick.row === 0 && brick.column === 0);
    const odd = first.find((brick) => brick.row === 1 && brick.column === 0);

    expect(first).toEqual(second);
    expect(even).toBeDefined();
    expect(odd).toBeDefined();
    expect(Math.abs((odd?.x ?? 0) - (even?.x ?? 0))).toBeCloseTo(45, 5);
    expect(new Set(first.map((brick) => brick.tone)).size).toBeGreaterThan(5);
    expect(first.some((brick) => brick.x < 0)).toBe(true);
    expect(first.some((brick) => brick.x + brick.width > 360)).toBe(true);
  });

  it("exposes the realistic brick wall as the default selectable background", () => {
    expect(BACKGROUND_PRESETS).toContain("brick-wall");
    expect(DEFAULT_SETTINGS.backgroundPreset).toBe("brick-wall");
  });
});
