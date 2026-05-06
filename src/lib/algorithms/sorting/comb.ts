import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const combSort: AlgoDef = {
  id: "comb",
  name: "Comb Sort",
  category: "sort",
  code: `let gap = n;
let swapped = true;
while (gap !== 1 || swapped) {
  gap = Math.max(1, Math.floor(gap / 1.3));
  swapped = false;
  for (let i = 0; i + gap < n; i++) {
    if (arr[i] > arr[i + gap]) {
      swap(i, i + gap);
      swapped = true;
    }
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    let gap = a.length;
    let swapped = true;
    while (gap !== 1 || swapped) {
      gap = Math.max(1, Math.floor(gap / 1.3));
      swapped = false;
      v.gap = gap; v.swapped = 0;
      for (let i = 0; i + gap < a.length; i++) {
        const j = i + gap;
        v.i = i; v.j = j;
        f.push(snap(a, 6, v, sorted, [i, j], [], null, { event: "compare" }));
        if (a[i] > a[j]) {
          [a[i], a[j]] = [a[j], a[i]];
          swapped = true; v.swapped = 1;
          f.push(snap(a, 8, v, sorted, [], [i, j], null, { event: "swap" }));
        }
      }
    }
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 12, v, sorted));
    return f;
  },
};
