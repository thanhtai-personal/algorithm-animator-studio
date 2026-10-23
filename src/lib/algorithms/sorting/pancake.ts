import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const pancakeSort: AlgoDef = {
  id: "pancake",
  name: "Pancake Sort",
  category: "sort",
  code: `for (let size = n; size > 1; size--) {
  let max = 0;
  for (let i = 1; i < size; i++) {
    if (arr[i] > arr[max]) max = i;
  }
  if (max !== size - 1) {
    flip(0, max);
    flip(0, size - 1);
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    f.push(snap(a, 0, v, sorted));

    for (let size = a.length; size > 1; size--) {
      v.size = size;
      v.phase = "scan max";
      let max = 0;
      v.max = max;

      for (let i = 1; i < size; i++) {
        v.i = i;
        f.push(snap(a, 3, v, sorted, [i, max], [], null, { event: "compare" }));
        if (a[i] > a[max]) {
          max = i;
          v.max = max;
          f.push(snap(a, 4, v, sorted, [max], [], null));
        }
      }

      if (max !== size - 1) {
        if (max > 0) {
          v.phase = "flip max to top";
          v.from = 0;
          v.to = max;
          flipPrefix(a, max);
          f.push(snap(a, 6, v, sorted, [], range(0, max), null, { event: "swap" }));
        }

        v.phase = "flip max to sorted end";
        v.from = 0;
        v.to = size - 1;
        flipPrefix(a, size - 1);
        f.push(snap(a, 7, v, sorted, [], range(0, size - 1), null, { event: "swap" }));
      }

      sorted.add(size - 1);
      f.push(snap(a, 9, v, sorted));
    }

    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 9, v, sorted));
    return f;
  },
};

function flipPrefix(values: number[], end: number) {
  for (let left = 0, right = end; left < right; left++, right--) {
    [values[left], values[right]] = [values[right], values[left]];
  }
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
