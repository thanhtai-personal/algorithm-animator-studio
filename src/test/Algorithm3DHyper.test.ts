import { describe, expect, it } from "vitest";
import type { Frame } from "@/lib/algorithms";
import { buildAlgorithm3DHyperTimeline, getAlgorithm3DHyperState } from "@/features/algorithm-video-3d/algorithm3dHyper";

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

describe("Algorithm 3D Hyper timeline", () => {
  it("compresses many swaps while preserving pre-swap frames for selected crane moves", () => {
    const frames: Frame[] = [frame([20, 19, 18, 17])];
    let arr = [20, 19, 18, 17];
    for (let i = 0; i < 30; i += 1) {
      const a = i % 3;
      const b = a + 1;
      frames.push(frame([...arr], { event: "compare", highlight: [a, b] }));
      const next = [...arr];
      [next[a], next[b]] = [next[b], next[a]];
      frames.push(frame(next, { event: "swap", swap: [a, b], highlight: [a, b] }));
      arr = next;
    }
    frames.push(frame([...arr].sort((a, b) => a - b), { sorted: [0, 1, 2, 3] }));

    const hyper = buildAlgorithm3DHyperTimeline(frames);
    expect(hyper.length).toBeLessThan(frames.length);
    const swaps = hyper.map((f, index) => ({ f, index })).filter(({ f }) => f.event === "swap");
    expect(swaps.length).toBeLessThanOrEqual(14);
    for (const { f, index } of swaps) {
      expect(index).toBeGreaterThan(0);
      const prev = hyper[index - 1];
      const [a, b] = f.swap;
      expect(prev.arr[a]).toBe(f.arr[b]);
      expect(prev.arr[b]).toBe(f.arr[a]);
    }
  });

  it("uses short hyper copy and final payoff", () => {
    const predict = frame([42, 17, 31], { event: "compare", highlight: [0, 1], vars: { __hyperRole: "predict" } });
    const state = getAlgorithm3DHyperState({ frame: predict, frameIndex: 2, frameCount: 10, lang: "vi" });
    expect(state.headline).toBe("42 > 17 ?");
    expect(state.detail).toBe("SWAP?");

    const finish = frame([17, 31, 42], { sorted: [0, 1, 2], vars: { __hyperRole: "finish" } });
    const done = getAlgorithm3DHyperState({ frame: finish, frameIndex: 9, frameCount: 10, lang: "vi" });
    expect(done.headline).toBe("SORTED ✓");
    expect(done.progress).toBe(1);
  });
});
