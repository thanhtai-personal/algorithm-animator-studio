import { describe, expect, it } from "vitest";
import type { Frame } from "@/lib/algorithms";
import { THEMES } from "@/lib/renderer";
import { arrayLayout, craneSwapPose3D, getBarMotion, getSwapPair } from "@/features/algorithm-video-3d/algorithm3dMath";
import {
  ALGORITHM_3D_OPERATION_SECONDS,
  CRANE_SWAP_SECONDS,
  PRE_SWAP_COMPARE_SECONDS,
  getAlgorithm3DFrameSeconds,
  isAlgorithm3DSortComplete,
  selectionReveal3D,
} from "@/features/algorithm-video-3d/algorithm3dTiming";

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

  it("matches the short-video compare/swap rhythm while keeping no-swap compares readable", () => {
    const compare = frame([8, 3, 6], { event: "compare", highlight: [0, 1] });
    const swap = frame([3, 8, 6], { event: "swap", swap: [0, 1] });

    expect(CRANE_SWAP_SECONDS).toBeCloseTo(8 / 30, 6);
    expect(PRE_SWAP_COMPARE_SECONDS).toBeCloseTo(4 / 30, 6);
    expect(getAlgorithm3DFrameSeconds(compare, swap)).toBeCloseTo(PRE_SWAP_COMPARE_SECONDS, 6);
    expect(getAlgorithm3DFrameSeconds(compare)).toBeCloseTo(ALGORITHM_3D_OPERATION_SECONDS, 6);
    expect(getAlgorithm3DFrameSeconds(compare, swap) + CRANE_SWAP_SECONDS).toBeCloseTo(ALGORITHM_3D_OPERATION_SECONDS, 6);
    expect(selectionReveal3D(0.05)).toBeLessThan(selectionReveal3D(0.25));
    expect(selectionReveal3D(1)).toBe(1);
  });

  it("recognizes only a fully sorted frame as a 3D completion", () => {
    expect(isAlgorithm3DSortComplete(frame([2, 4, 8], { sorted: [0, 1, 2] }))).toBe(true);
    expect(isAlgorithm3DSortComplete(frame([2, 4, 8], { sorted: [0, 1] }))).toBe(false);
    expect(isAlgorithm3DSortComplete(frame([], { sorted: [] }))).toBe(false);
  });

  it("spends most of the fast swap carrying the buildings instead of parking the cranes", () => {
    const transporting = craneSwapPose3D(-4, 4, 0.5);
    const lowering = craneSwapPose3D(-4, 4, 0.875);
    expect(transporting.phase).toBe("transport");
    expect(transporting.building.position[0]).toBeGreaterThan(-4);
    expect(transporting.building.position[0]).toBeLessThan(4);
    expect(lowering.phase).toBe("lower");
  });

});
