import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const bitonicSort: AlgoDef = {
  id: "bitonic",
  name: "Bitonic Sort",
  category: "sort",
  code: `function bitonicSort(lo, count, dir) {
  if (count <= 1) return;
  const k = Math.floor(count / 2);
  bitonicSort(lo, k, true);
  bitonicSort(lo + k, count - k, false);
  bitonicMerge(lo, count, dir);
}
function bitonicMerge(lo, count, dir) {
  if (count <= 1) return;
  const gap = greatestPowerOfTwoLessThan(count);
  for (let i = lo; i < lo + count - gap; i++) {
    compareAndSwap(i, i + gap, dir);
  }
  bitonicMerge(lo, gap, dir);
  bitonicMerge(lo + gap, count - gap, dir);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    f.push(snap(a, 0, v, sorted));

    const compareAndSwap = (i: number, j: number, dir: boolean) => {
      v.i = i; v.j = j; v.dir = dir ? "asc" : "desc";
      f.push(snap(a, 10, v, sorted, [i, j], [], null, { event: "compare" }));
      if ((dir && a[i] > a[j]) || (!dir && a[i] < a[j])) {
        [a[i], a[j]] = [a[j], a[i]];
        f.push(snap(a, 11, v, sorted, [], [i, j], null, { event: "swap" }));
      }
    };

    const bitonicMerge = (lo: number, count: number, dir: boolean) => {
      if (count <= 1) return;
      const gap = greatestPowerOfTwoLessThan(count);
      v.stage = "merge"; v.lo = lo; v.count = count; v.gap = gap; v.dir = dir ? "asc" : "desc";
      for (let i = lo; i < lo + count - gap; i++) compareAndSwap(i, i + gap, dir);
      bitonicMerge(lo, gap, dir);
      bitonicMerge(lo + gap, count - gap, dir);
    };

    const sortRange = (lo: number, count: number, dir: boolean) => {
      if (count <= 1) return;
      const k = Math.floor(count / 2);
      v.stage = "split"; v.lo = lo; v.count = count; v.mid = lo + k; v.dir = dir ? "asc" : "desc";
      f.push(snap(a, 2, v, sorted, range(lo, lo + count - 1)));
      sortRange(lo, k, true);
      sortRange(lo + k, count - k, false);
      bitonicMerge(lo, count, dir);
    };

    sortRange(0, a.length, true);
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 18, v, sorted));
    return f;
  },
};

function greatestPowerOfTwoLessThan(n: number) {
  let value = 1;
  while (value * 2 < n) value *= 2;
  return value;
}

function range(start: number, end: number) {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}
