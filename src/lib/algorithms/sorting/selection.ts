import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const selectionSort: AlgoDef = {
  id: "selection",
  name: "Selection Sort",
  category: "sort",
  code: `for (let i = 0; i < n; i++) {
  let min = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[min]) min = j;
  }
  if (min !== i) [arr[i], arr[min]] = [arr[min], arr[i]];
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    for (let i = 0; i < a.length; i++) {
      v.i = i;
      let min = i;
      v.min = min;
      f.push(snap(a, 1, v, sorted, [i], [], null));
      for (let j = i + 1; j < a.length; j++) {
        v.j = j;
        f.push(snap(a, 3, v, sorted, [j, min], [], null, { event: "compare" }));
        if (a[j] < a[min]) {
          min = j;
          v.min = min;
        }
      }
      if (min !== i) {
        [a[i], a[min]] = [a[min], a[i]];
        f.push(snap(a, 5, v, sorted, [], [i, min], null, { event: "swap" }));
      }
      sorted.add(i);
      f.push(snap(a, 6, v, sorted));
    }
    return f;
  },
};
