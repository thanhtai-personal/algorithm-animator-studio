import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const cocktailSort: AlgoDef = {
  id: "cocktail",
  name: "Cocktail Shaker Sort",
  category: "sort",
  code: `let start = 0, end = n - 1, swapped = true;
while (swapped) {
  swapped = false;
  for (let i = start; i < end; i++) {
    if (arr[i] > arr[i + 1]) swap(i, i + 1);
  }
  end--;
  for (let i = end; i > start; i--) {
    if (arr[i - 1] > arr[i]) swap(i - 1, i);
  }
  start++;
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    let start = 0, end = a.length - 1, swapped = true;
    while (swapped) {
      swapped = false;
      v.start = start; v.end = end; v.direction = "forward";
      for (let i = start; i < end; i++) {
        v.i = i;
        f.push(snap(a, 3, v, sorted, [i, i + 1], [], null, { event: "compare" }));
        if (a[i] > a[i + 1]) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]];
          swapped = true; v.swapped = 1;
          f.push(snap(a, 4, v, sorted, [], [i, i + 1], null, { event: "swap" }));
        }
      }
      sorted.add(end--);
      f.push(snap(a, 6, v, sorted));
      if (!swapped) break;
      swapped = false;
      v.start = start; v.end = end; v.direction = "backward";
      for (let i = end; i > start; i--) {
        v.i = i;
        f.push(snap(a, 8, v, sorted, [i - 1, i], [], null, { event: "compare" }));
        if (a[i - 1] > a[i]) {
          [a[i - 1], a[i]] = [a[i], a[i - 1]];
          swapped = true; v.swapped = 1;
          f.push(snap(a, 9, v, sorted, [], [i - 1, i], null, { event: "swap" }));
        }
      }
      sorted.add(start++);
      f.push(snap(a, 11, v, sorted));
    }
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 12, v, sorted));
    return f;
  },
};
