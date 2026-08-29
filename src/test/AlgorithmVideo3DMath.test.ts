import { describe, expect, it } from "vitest";
import type { Frame } from "@/lib/algorithms";
import { THEMES } from "@/lib/renderer";
import { arrayLayout, getBarMotion, getSwapPair } from "@/features/algorithm-video-3d/algorithm3dMath";

function frame(arr: number[], overrides: Partial<Frame> = {}): Frame {
  return {
    arr,
    highlight: [],
    swap: [],
    sorted: [],
    pivot: null,
    line: 1,
    vars: {},
    event: null,
    ...overrides,
  };
}

describe("algorithm video 3D math", () => {
  it("maps a real swap back to the source indices", () => {
    const previous = frame([9, 2, 5]);
    const current = frame([2, 9, 5], { event: "swap", swap: [0, 1] });
    expect(getSwapPair(current, previous)).toEqual([0, 1]);
    const motion = getBarMotion(current, previous, THEMES.neon);
    expect(motion[0].fromIndex).toBe(1);
    expect(motion[1].fromIndex).toBe(0);
  });

  it("does not animate an unrelated swap marker", () => {
    const previous = frame([9, 2, 5]);
    const current = frame([9, 2, 5], { event: "swap", swap: [0, 1] });
    expect(getSwapPair(current, previous)).toBeNull();
  });

  it("keeps larger values visually taller across negative ranges", () => {
    const layout = arrayLayout([-8, -1, 6]);
    expect(layout.heightFor(6)).toBeGreaterThan(layout.heightFor(-1));
    expect(layout.heightFor(-1)).toBeGreaterThan(layout.heightFor(-8));
  });
});
