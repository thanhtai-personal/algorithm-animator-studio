import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const shellSort: AlgoDef = {
  id: "shell",
  name: "Shell Sort",
  category: "sort",
  code: `for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
  for (let i = gap; i < n; i++) {
    const temp = arr[i];
    let j = i;
    while (j >= gap && arr[j - gap] > temp) {
      arr[j] = arr[j - gap];
      j -= gap;
    }
    arr[j] = temp;
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    for (let gap = Math.floor(a.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      v.gap = gap;
      for (let i = gap; i < a.length; i++) {
        const temp = a[i];
        let j = i;
        v.i = i; v.j = j; v.temp = temp;
        f.push(snap(a, 2, v, sorted, [i], [], null));
        while (j >= gap) {
          v.j = j;
          f.push(snap(a, 5, v, sorted, [j - gap, j], [], null, { event: "compare" }));
          if (a[j - gap] <= temp) break;
          a[j] = a[j - gap];
          f.push(snap(a, 6, v, sorted, [], [j], null, { event: "swap" }));
          j -= gap;
        }
        a[j] = temp;
        v.j = j;
        f.push(snap(a, 9, v, sorted, [j], [j], null, { event: "swap" }));
      }
    }
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 10, v, sorted));
    return f;
  },
};
