import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const mergeSort: AlgoDef = {
  id: "merge",
  name: "Merge Sort",
  category: "sort",
  code: `function merge(lo, mid, hi) {
  const tmp = [];
  let i = lo, j = mid + 1;
  while (i <= mid && j <= hi)
    tmp.push(arr[i] <= arr[j] ? arr[i++] : arr[j++]);
  while (i <= mid) tmp.push(arr[i++]);
  while (j <= hi) tmp.push(arr[j++]);
  for (let k = 0; k < tmp.length; k++) arr[lo + k] = tmp[k];
}
function ms(lo, hi) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  ms(lo, mid); ms(mid + 1, hi);
  merge(lo, mid, hi);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    const merge = (lo: number, mid: number, hi: number) => {
      const tmp: number[] = [];
      let i = lo, j = mid + 1;
      while (i <= mid && j <= hi) {
        v.i = i; v.j = j;
        f.push(snap(a, 4, v, sorted, [i, j], [], null, { event: "compare" }));
        if (a[i] <= a[j]) tmp.push(a[i++]); else tmp.push(a[j++]);
      }
      while (i <= mid) tmp.push(a[i++]);
      while (j <= hi) tmp.push(a[j++]);
      for (let k = 0; k < tmp.length; k++) {
        a[lo + k] = tmp[k];
        f.push(snap(a, 7, v, sorted, [lo + k], [], null, { event: "swap" }));
      }
    };
    const ms = (lo: number, hi: number) => {
      if (lo >= hi) { if (lo === hi) sorted.add(lo); return; }
      const mid = (lo + hi) >> 1;
      v.lo = lo; v.hi = hi; v.mid = mid;
      f.push(snap(a, 11, v, sorted));
      ms(lo, mid); ms(mid + 1, hi);
      merge(lo, mid, hi);
      for (let k = lo; k <= hi; k++) sorted.add(k);
      f.push(snap(a, 13, v, sorted));
    };
    ms(0, a.length - 1);
    for (let k = 0; k < a.length; k++) sorted.add(k);
    f.push(snap(a, 13, v, sorted));
    return f;
  },
};
