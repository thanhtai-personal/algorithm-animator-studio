import { describe, expect, it } from "vitest";
import type { Frame } from "@/lib/algorithms";
import { THEMES } from "@/lib/renderer";
import { arrayLayout, craneSwapPose3D, getBarMotion, getSwapPair } from "@/features/algorithm-video-3d/algorithm3dMath";
import { getAlgorithm3DFrameSeconds, selectionReveal3D } from "@/features/algorithm-video-3d/algorithm3dTiming";

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

  it("routes the two swapped buildings through separate front/back crane lanes", () => {
    const right = craneSwapPose3D(-4, 4, 0.5);
    const left = craneSwapPose3D(4, -4, 0.5);
    expect(right.laneZ).toBeGreaterThan(0);
    expect(left.laneZ).toBeLessThan(0);
    expect(right.building.position[1]).toBeGreaterThan(0);
    expect(left.building.position[1]).toBeGreaterThan(0);
    expect(right.building.position[2]).not.toBe(left.building.position[2]);
  });

  it("keeps larger values visually taller across negative ranges", () => {
    const layout = arrayLayout([-8, -1, 6]);
    expect(layout.heightFor(6)).toBeGreaterThan(layout.heightFor(-1));
    expect(layout.heightFor(-1)).toBeGreaterThan(layout.heightFor(-8));
  });
  it("drives the crane in from parking before touching the building", () => {
    const start = craneSwapPose3D(-2, 4, 0, -12);
    const arrived = craneSwapPose3D(-2, 4, 0.18, -12);
    const finished = craneSwapPose3D(-2, 4, 1, -12);
    expect(start.truckX).toBeCloseTo(-12);
    expect(start.building.position).toEqual([-2, 0, 0]);
    expect(arrived.truckX).toBeCloseTo(-2);
    expect(arrived.building.position[0]).toBeCloseTo(-2);
    expect(finished.truckX).toBeCloseTo(-12);
    expect(finished.building.position[0]).toBeCloseTo(4);
  });

  it("gives 3D selection enough dwell time and a soft reveal", () => {
    expect(getAlgorithm3DFrameSeconds(frame([3, 2, 1], { event: "compare" }))).toBeGreaterThanOrEqual(0.18);
    expect(selectionReveal3D(0.05)).toBeLessThan(selectionReveal3D(0.25));
    expect(selectionReveal3D(1)).toBe(1);
  });

});
