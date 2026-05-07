# Sorting Algorithm Implementation Tasks

## Shared Context

This project is a Vite React 18 TypeScript app. Sorting algorithms are currently implemented in `src/lib/algorithms.ts`.

The existing algorithm model:

- `Frame` represents one animation step.
- `AlgoDef` represents one algorithm with `id`, `name`, `category`, `code`, `complexity`, and `run()`.
- `COMPLEXITY` is a `Record<string, Complexity>` near the top of `src/lib/algorithms.ts`.
- `snap()` is the helper used by sorting algorithms to create animation frames.
- Sorting algorithm implementations are under the `/* ---------------- SORTING ---------------- */` section.
- `ALGORITHMS` registers each algorithm id to its `AlgoDef`.
- `ALGO_GROUPS[0]` is the Sorting group shown in the UI.
- Tests currently live in `src/test/example.test.ts`.

Implementation pattern to follow:

- Add a `COMPLEXITY.<id>` entry.
- Add a `const <algorithmName>: AlgoDef = { ... }` under the sorting section.
- Set `category: "sort"`.
- Use `snap()` for all animation frames.
- Use `event: "compare"` when comparing values.
- Use `event: "swap"` when moving or rewriting array values.
- Use `sorted: Set<number>` to mark finalized positions.
- Add the algorithm to `ALGORITHMS`.
- Add the algorithm id to the Sorting group in `ALGO_GROUPS`.
- Add or update Vitest coverage in `src/test/example.test.ts`.
- Run `npm run test` and `npm run build`.

File-size rule:

- New or touched source files should stay at or below 400 lines when practical.
- `src/lib/algorithms.ts` is already a legacy file above this limit. If editing it for the algorithm registry, keep the change tightly scoped and note the exception in the task result.

Test pattern:

```ts
const frames = ALGORITHMS.<id>.run([9, 1, 6, 3, 8, 2]);
expect(frames.at(-1)?.arr).toEqual([1, 2, 3, 6, 8, 9]);
expect(COMPLEXITY.<id>.time).toBe("<expected>");
expect(ALGO_GROUPS[0].ids).toContain("<id>");
```

## 1. Add Counting Sort

Context:

- Add a non-comparison sorting algorithm for integer arrays.
- The app input currently uses `number[]`; Counting Sort should assume finite integer values.
- Existing demo arrays may include small positive numbers, but the implementation should also handle negative integers by offsetting with `min`.

Required implementation:

- Use id `counting`.
- Use display name `Counting Sort`.
- Add complexity:
  - `time: "O(n + k)"`
  - `best: "O(n + k)"`
  - `worst: "O(n + k)"`
  - `space: "O(k)"`
- Algorithm flow:
  - Find `min` and `max`.
  - Create `count` array with length `max - min + 1`.
  - Count each value using `value - min`.
  - Rewrite the original array in sorted order.
- Animation requirements:
  - Highlight the current input index while counting.
  - Store useful vars such as `min`, `max`, `value`, `bucket`, `count`.
  - When rewriting `arr[index]`, emit a frame with `event: "swap"` even though it is an assignment.
  - Mark positions sorted as they are rewritten.
- Registration:
  - Add `counting` to `ALGORITHMS`.
  - Add `counting` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[4, -1, 2, 4, 0, -1]`.
  - Verify complexity and Sorting group registration.

## 2. Add Radix Sort

Context:

- Add a digit-based integer sort.
- To keep scope practical, implement Least Significant Digit radix sort for base 10.
- Handle negative numbers by sorting negatives and non-negatives separately, then combine negatives in descending absolute-value order before non-negatives.

Required implementation:

- Use id `radix`.
- Use display name `Radix Sort`.
- Add complexity:
  - `time: "O(d(n + b))"`
  - `best: "O(d(n + b))"`
  - `worst: "O(d(n + b))"`
  - `space: "O(n + b)"`
- Algorithm flow:
  - Split values into negative and non-negative groups.
  - Sort each group by absolute value using LSD passes.
  - Use base `b = 10`.
  - Recombine as negative values first, then non-negative values.
- Animation requirements:
  - Store vars such as `exp`, `digit`, `bucket`, `phase`.
  - Highlight each value when its digit is read.
  - Emit assignment frames with `event: "swap"` when each pass writes values back.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `radix` to `ALGORITHMS`.
  - Add `radix` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[170, 45, 75, -90, 802, 24, 2, 66]`.
  - Verify complexity and Sorting group registration.

## 3. Add Bucket Sort

Context:

- Add Bucket Sort for numeric arrays.
- The app visualizes integer bars, so use buckets over the numeric range instead of assuming decimal values in `[0, 1)`.

Required implementation:

- Use id `bucket`.
- Use display name `Bucket Sort`.
- Add complexity:
  - `time: "O(n + k)"`
  - `best: "O(n + k)"`
  - `worst: "O(n²)"`
  - `space: "O(n + k)"`
- Algorithm flow:
  - Find `min` and `max`.
  - Choose `bucketCount = Math.max(1, Math.ceil(Math.sqrt(n)))`.
  - Map each value into a bucket based on range.
  - Sort each bucket locally with insertion sort or `bucket.sort((a, b) => a - b)`.
  - Concatenate buckets back into the array.
- Animation requirements:
  - Highlight each input index when assigning to a bucket.
  - Store vars such as `bucketCount`, `bucketIndex`, `min`, `max`.
  - Emit `event: "compare"` while distributing values.
  - Emit `event: "swap"` while writing sorted bucket values back.
  - Mark positions sorted as they are written back.
- Registration:
  - Add `bucket` to `ALGORITHMS`.
  - Add `bucket` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[29, 25, 3, 49, 9, 37, 21, 43]`.
  - Verify complexity and Sorting group registration.

## 4. Add Shell Sort

Context:

- Add Shell Sort as an in-place comparison sort.
- Use a simple gap sequence so animation is easy to understand.

Required implementation:

- Use id `shell`.
- Use display name `Shell Sort`.
- Add complexity:
  - `time: "O(n log² n)"`
  - `best: "O(n log n)"`
  - `worst: "O(n²)"`
  - `space: "O(1)"`
- Algorithm flow:
  - Start with `gap = Math.floor(n / 2)`.
  - Reduce with `gap = Math.floor(gap / 2)` until zero.
  - For each gap, perform gapped insertion sort.
- Animation requirements:
  - Store vars such as `gap`, `i`, `j`, `temp`.
  - Highlight compared gapped indices.
  - Emit `event: "compare"` for gapped comparisons.
  - Emit `event: "swap"` for element shifts or final placement.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `shell` to `ALGORITHMS`.
  - Add `shell` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[12, 34, 54, 2, 3]`.
  - Verify complexity and Sorting group registration.

## 5. Add Cocktail Shaker Sort

Context:

- Add bidirectional Bubble Sort.
- This should be visually similar to Bubble Sort but with forward and backward passes.

Required implementation:

- Use id `cocktail`.
- Use display name `Cocktail Shaker Sort`.
- Add complexity:
  - `time: "O(n²)"`
  - `best: "O(n)"`
  - `worst: "O(n²)"`
  - `space: "O(1)"`
- Algorithm flow:
  - Keep `start`, `end`, and `swapped`.
  - Bubble the largest value to `end`.
  - Bubble the smallest value to `start`.
  - Shrink both bounds each full pass.
- Animation requirements:
  - Store vars such as `start`, `end`, `i`, `direction`.
  - Use `event: "compare"` for adjacent comparisons.
  - Use `event: "swap"` for swaps.
  - Mark finalized `start` and `end` positions after each pass.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `cocktail` to `ALGORITHMS`.
  - Add `cocktail` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[5, 1, 4, 2, 8, 0, 2]`.
  - Verify complexity and Sorting group registration.

## 6. Add Comb Sort

Context:

- Add Comb Sort as a gap-based improvement over Bubble Sort.
- Use the standard shrink factor `1.3`.

Required implementation:

- Use id `comb`.
- Use display name `Comb Sort`.
- Add complexity:
  - `time: "O(n²)"`
  - `best: "O(n log n)"`
  - `worst: "O(n²)"`
  - `space: "O(1)"`
- Algorithm flow:
  - Start with `gap = n`.
  - Repeatedly set `gap = Math.max(1, Math.floor(gap / 1.3))`.
  - Continue until `gap === 1` and a full pass has no swaps.
- Animation requirements:
  - Store vars such as `gap`, `i`, `j`, `swapped`.
  - Highlight compared gap pair `[i, i + gap]`.
  - Emit `event: "compare"` for each gap comparison.
  - Emit `event: "swap"` when values are swapped.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `comb` to `ALGORITHMS`.
  - Add `comb` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[8, 4, 1, 56, 3, -44, 23, -6, 28, 0]`.
  - Verify complexity and Sorting group registration.

## 7. Add Gnome Sort

Context:

- Add Gnome Sort as a simple adjacent-swap sorting algorithm.
- This is useful for showing local corrections and backwards movement.

Required implementation:

- Use id `gnome`.
- Use display name `Gnome Sort`.
- Add complexity:
  - `time: "O(n²)"`
  - `best: "O(n)"`
  - `worst: "O(n²)"`
  - `space: "O(1)"`
- Algorithm flow:
  - Start `index = 0`.
  - If `index === 0` or `arr[index] >= arr[index - 1]`, move forward.
  - Otherwise swap adjacent values and move backward.
- Animation requirements:
  - Store vars such as `index`.
  - Highlight `[index - 1, index]` before comparing when `index > 0`.
  - Emit `event: "compare"` for adjacent comparisons.
  - Emit `event: "swap"` for adjacent swaps.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `gnome` to `ALGORITHMS`.
  - Add `gnome` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[34, 2, 10, -9]`.
  - Verify complexity and Sorting group registration.

## 8. Add Tim Sort

Context:

- Add a simplified Tim Sort suitable for visualization.
- Full production TimSort is complex; implement the educational version with insertion-sorted runs and iterative merging.

Required implementation:

- Use id `tim`.
- Use display name `Tim Sort`.
- Add complexity:
  - `time: "O(n log n)"`
  - `best: "O(n)"`
  - `worst: "O(n log n)"`
  - `space: "O(n)"`
- Algorithm flow:
  - Use `RUN = 32`, but for small demo arrays use `Math.min(32, n)`.
  - Sort each run with insertion sort.
  - Merge runs bottom-up by doubling size.
- Animation requirements:
  - Store vars such as `runStart`, `runEnd`, `size`, `left`, `mid`, `right`.
  - Emit compare/swap frames during insertion sort for each run.
  - Emit compare frames while merging.
  - Emit assignment frames with `event: "swap"` while writing merged values back.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `tim` to `ALGORITHMS`.
  - Add `tim` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[5, 21, 7, 23, 19, 10, 1, 3, 2]`.
  - Verify complexity and Sorting group registration.

## 9. Add Intro Sort

Context:

- Add Intro Sort as a hybrid sorting algorithm.
- Use Quick Sort by default, switch to Heap Sort when recursion depth is exhausted, and use Insertion Sort for small partitions.

Required implementation:

- Use id `intro`.
- Use display name `Intro Sort`.
- Add complexity:
  - `time: "O(n log n)"`
  - `best: "O(n log n)"`
  - `worst: "O(n log n)"`
  - `space: "O(log n)"`
- Algorithm flow:
  - Compute `depthLimit = 2 * Math.floor(Math.log2(n || 1))`.
  - For partitions with size `<= 16`, use insertion sort.
  - If `depthLimit === 0`, heap-sort the current partition.
  - Otherwise partition with Quick Sort and recurse.
- Animation requirements:
  - Store vars such as `lo`, `hi`, `depthLimit`, `pivot`, `mode`.
  - Set `mode` to `"quick"`, `"heap"`, or `"insertion"` depending on the active strategy.
  - Use `event: "compare"` for comparisons.
  - Use `event: "swap"` for swaps and assignments.
  - Use `pivot` frame field during quick partitioning.
  - Mark all indices sorted in the final frame.
- Registration:
  - Add `intro` to `ALGORITHMS`.
  - Add `intro` to `ALGO_GROUPS[0].ids`.
- Tests:
  - Verify sorted output for `[10, 7, 8, 9, 1, 5, 3, 2, 6, 4]`.
  - Verify complexity and Sorting group registration.
