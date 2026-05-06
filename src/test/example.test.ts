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

  it.each([
    ["counting", [4, -1, 2, 4, 0, -1], [-1, -1, 0, 2, 4, 4], "O(n + k)"],
    ["radix", [170, 45, 75, -90, 802, 24, 2, 66], [-90, 2, 24, 45, 66, 75, 170, 802], "O(d(n + b))"],
    ["bucket", [29, 25, 3, 49, 9, 37, 21, 43], [3, 9, 21, 25, 29, 37, 43, 49], "O(n + k)"],
    ["shell", [12, 34, 54, 2, 3], [2, 3, 12, 34, 54], "O(n log² n)"],
    ["cocktail", [5, 1, 4, 2, 8, 0, 2], [0, 1, 2, 2, 4, 5, 8], "O(n²)"],
    ["comb", [8, 4, 1, 56, 3, -44, 23, -6, 28, 0], [-44, -6, 0, 1, 3, 4, 8, 23, 28, 56], "O(n²)"],
    ["gnome", [34, 2, 10, -9], [-9, 2, 10, 34], "O(n²)"],
    ["tim", [5, 21, 7, 23, 19, 10, 1, 3, 2], [1, 2, 3, 5, 7, 10, 19, 21, 23], "O(n log n)"],
    ["intro", [10, 7, 8, 9, 1, 5, 3, 2, 6, 4], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "O(n log n)"],
  ])("runs %s sort to a sorted final frame", (id, input, expected, time) => {
    const frames = ALGORITHMS[id].run(input);
    expect(frames.at(-1)?.arr).toEqual(expected);
    expect(COMPLEXITY[id].time).toBe(time);
    expect(ALGO_GROUPS[0].ids).toContain(id);
  });
});
