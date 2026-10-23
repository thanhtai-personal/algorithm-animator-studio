import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const introSort: AlgoDef = {
  id: "intro",
  name: "Intro Sort",
  category: "sort",
  code: `function intro(lo, hi, depthLimit) {
  if (hi - lo <= 16) return insertion(lo, hi);
  if (depthLimit === 0) return heapSort(lo, hi);
  const p = partition(lo, hi);
  intro(lo, p - 1, depthLimit - 1);
  intro(p + 1, hi, depthLimit - 1);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};

    const insertion = (lo: number, hi: number) => {
      v.mode = "insertion"; v.lo = lo; v.hi = hi;
      for (let i = lo + 1; i <= hi; i++) {
        const key = a[i];
        let j = i - 1;
        v.i = i; v.key = key;
        while (j >= lo) {
          v.j = j;
          f.push(snap(a, 2, v, sorted, [j, j + 1], [], null, { event: "compare" }));
          if (a[j] <= key) break;
          a[j + 1] = a[j];
          f.push(snap(a, 3, v, sorted, [], [j, j + 1], null, { event: "swap" }));
          j--;
        }
        a[j + 1] = key;
        f.push(snap(a, 4, v, sorted, [j + 1], [j + 1], null, { event: "swap" }));
      }
    };

    const heapify = (lo: number, count: number, root: number) => {
      let largest = root;
      const left = 2 * root + 1;
      const right = left + 1;
      v.mode = "heap"; v.lo = lo; v.hi = lo + count - 1; v.root = root;
      if (left < count) {
        f.push(snap(a, 2, v, sorted, [lo + left, lo + largest], [], null, { event: "compare" }));
        if (a[lo + left] > a[lo + largest]) largest = left;
      }
      if (right < count) {
        f.push(snap(a, 2, v, sorted, [lo + right, lo + largest], [], null, { event: "compare" }));
        if (a[lo + right] > a[lo + largest]) largest = right;
      }
      if (largest !== root) {
        [a[lo + root], a[lo + largest]] = [a[lo + largest], a[lo + root]];
        f.push(snap(a, 3, v, sorted, [], [lo + root, lo + largest], null, { event: "swap" }));
        heapify(lo, count, largest);
      }
    };

    const heapSortRange = (lo: number, hi: number) => {
      const count = hi - lo + 1;
      v.mode = "heap"; v.lo = lo; v.hi = hi;
      for (let i = Math.floor(count / 2) - 1; i >= 0; i--) heapify(lo, count, i);
      for (let end = count - 1; end > 0; end--) {
        [a[lo], a[lo + end]] = [a[lo + end], a[lo]];
        f.push(snap(a, 3, v, sorted, [], [lo, lo + end], null, { event: "swap" }));
        heapify(lo, end, 0);
      }
    };

    const partition = (lo: number, hi: number) => {
      const pivotValue = a[hi];
      let i = lo - 1;
      v.mode = "quick"; v.lo = lo; v.hi = hi; v.pivot = pivotValue;
      for (let j = lo; j < hi; j++) {
        v.j = j;
        f.push(snap(a, 2, v, sorted, [j], [], hi, { event: "compare" }));
        if (a[j] <= pivotValue) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
          f.push(snap(a, 3, v, sorted, [], [i, j], hi, { event: "swap" }));
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      f.push(snap(a, 3, v, sorted, [], [i + 1, hi], null, { event: "swap" }));
      return i + 1;
    };

    const intro = (lo: number, hi: number, depthLimit: number) => {
      if (lo >= hi) return;
      v.lo = lo; v.hi = hi; v.depthLimit = depthLimit;
      if (hi - lo <= 16) { insertion(lo, hi); return; }
      if (depthLimit === 0) { heapSortRange(lo, hi); return; }
      const p = partition(lo, hi);
      intro(lo, p - 1, depthLimit - 1);
      intro(p + 1, hi, depthLimit - 1);
    };

    intro(0, a.length - 1, 2 * Math.floor(Math.log2(a.length || 1)));
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 7, v, sorted));
    return f;
  },
};
