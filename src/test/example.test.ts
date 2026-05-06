import { describe, it, expect } from "vitest";
import { ALGORITHMS, ALGO_GROUPS, COMPLEXITY } from "@/lib/algorithms";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("runs heap sort to a sorted final frame", () => {
    const frames = ALGORITHMS.heap.run([9, 1, 6, 3, 8, 2]);
    expect(frames.at(-1)?.arr).toEqual([1, 2, 3, 6, 8, 9]);
    expect(COMPLEXITY.heap.time).toBe("O(n log n)");
    expect(ALGO_GROUPS[0].ids).toContain("heap");
  });
});
