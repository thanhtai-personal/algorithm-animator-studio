import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const quickSort: AlgoDef = {
  id: "quick",
  name: "Quick Sort",
  category: "sort",
  code: `function quick(lo, hi) {
  if (lo >= hi) return;
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
  quick(lo, i);
  quick(i + 2, hi);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    const quick = (lo: number, hi: number) => {
      f.push(snap(a, 0, v, sorted, [], [], hi >= 0 && hi < a.length ? hi : null));
      if (lo > hi) return;
      if (lo === hi) {
        sorted.add(lo);
        f.push(snap(a, 1, v, sorted));
        return;
      }
      v.lo = lo;
      v.hi = hi;
      const pivot = a[hi];
      v.pivot = pivot;
      f.push(snap(a, 2, v, sorted, [], [], hi));
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        v.j = j;
        f.push(snap(a, 5, v, sorted, [j], [], hi, { event: "compare" }));
        if (a[j] < pivot) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
          f.push(snap(a, 7, v, sorted, [], [i, j], hi, { event: "swap" }));
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      f.push(snap(a, 10, v, sorted, [], [i + 1, hi], null, { event: "swap" }));
      sorted.add(i + 1);
      quick(lo, i);
      quick(i + 2, hi);
    };
    quick(0, a.length - 1);
    for (let k = 0; k < a.length; k++) sorted.add(k);
    f.push(snap(a, 13, v, sorted));
    return f;
  },
};
