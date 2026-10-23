import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const insertionSort: AlgoDef = {
  id: "insertion",
  name: "Insertion Sort",
  category: "sort",
  code: `for (let i = 1; i < n; i++) {
  let key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j--;
  }
  arr[j + 1] = key;
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>([0]);
    const v: Record<string, number | string> = {};
    for (let i = 1; i < a.length; i++) {
      v.i = i;
      const key = a[i];
      v.key = key;
      f.push(snap(a, 1, v, sorted, [i], [], null));
      let j = i - 1;
      v.j = j;
      f.push(snap(a, 3, v, sorted, [j, i], [], null, { event: "compare" }));
      while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j];
        f.push(snap(a, 4, v, sorted, [], [j, j + 1], null, { event: "swap" }));
        j--;
        v.j = j;
        f.push(snap(a, 3, v, sorted, [Math.max(j, 0), j + 1], [], null, { event: "compare" }));
      }
      a[j + 1] = key;
      sorted.add(i);
      f.push(snap(a, 7, v, sorted));
    }
    return f;
  },
};
