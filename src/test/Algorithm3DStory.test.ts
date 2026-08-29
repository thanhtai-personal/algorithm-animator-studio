import { describe, expect, it } from "vitest";
import type { Frame } from "@/lib/algorithms";
import { getAlgorithm3DStoryState } from "@/features/algorithm-video-3d/algorithm3dStory";

function frame(overrides: Partial<Frame> = {}): Frame {
  return {
    arr: [42, 17, 31],
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

describe("Algorithm 3D Story state", () => {
  it("turns a compare frame into a prediction question", () => {
    const state = getAlgorithm3DStoryState({
      frame: frame({ event: "compare", highlight: [0, 1] }),
      frameIndex: 4,
      frameCount: 20,
      title: "Bubble Sort",
      lang: "vi",
    });
    expect(state.headline).toBe("42  >  17 ?");
    expect(state.kicker).toBe("DỰ ĐOÁN");
  });

  it("uses sorted indices as real city progress", () => {
    const state = getAlgorithm3DStoryState({
      frame: frame({ sorted: [2] }),
      frameIndex: 8,
      frameCount: 20,
      title: "Bubble Sort",
      lang: "en",
    });
    expect(state.completed).toBe(1);
    expect(state.progress).toBeCloseTo(1 / 3);
  });

  it("shows a completion payoff on the final frame", () => {
    const state = getAlgorithm3DStoryState({
      frame: frame({ sorted: [0, 1, 2] }),
      frameIndex: 19,
      frameCount: 20,
      title: "Bubble Sort",
      lang: "en",
    });
    expect(state.complete).toBe(true);
    expect(state.headline).toBe("CITY SORTED ✓");
    expect(state.progress).toBe(1);
  });
});
