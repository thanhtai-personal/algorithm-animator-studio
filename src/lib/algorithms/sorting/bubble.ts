import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const bubbleSort: AlgoDef = {
  id: "bubble",
  name: "Bubble Sort",
  category: "sort",
  code: `for (let i = 0; i < n; i++) {
  let swapped = false;
  for (let j = 0; j < n - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      swapped = true;
    }
  }
  if (!swapped) break;
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    f.push(snap(a, 0, v, sorted));
    for (let i = 0; i < a.length; i++) {
      v.i = i;
      v.swapped = "false";
      let swapped = false;
      for (let j = 0; j < a.length - i - 1; j++) {
        v.j = j;
        f.push(snap(a, 2, v, sorted, [j, j + 1], [], null, { event: "compare" }));
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          v.swapped = "true";
          f.push(snap(a, 3, v, sorted, [], [j, j + 1], null, { event: "swap" }));
        }
      }
      sorted.add(a.length - i - 1);
      f.push(snap(a, 5, v, sorted));
      if (!swapped) break;
    }
    for (let k = 0; k < a.length; k++) sorted.add(k);
    f.push(snap(a, 6, v, sorted));
    return f;
  },
};
