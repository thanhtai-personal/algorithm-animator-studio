import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const timSort: AlgoDef = {
  id: "tim",
  name: "Tim Sort",
  category: "sort",
  code: `const RUN = Math.min(32, n);
for (let start = 0; start < n; start += RUN) {
  insertionSort(start, Math.min(start + RUN - 1, n - 1));
}
for (let size = RUN; size < n; size *= 2) {
  for (let left = 0; left < n; left += 2 * size) {
    merge(left, left + size - 1, Math.min(left + 2 * size - 1, n - 1));
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    const run = Math.min(32, Math.max(1, a.length));

    const insertion = (left: number, right: number) => {
      v.runStart = left; v.runEnd = right;
      for (let i = left + 1; i <= right; i++) {
        const temp = a[i];
        let j = i - 1;
        v.i = i; v.temp = temp;
        while (j >= left) {
          v.j = j;
          f.push(snap(a, 2, v, sorted, [j, j + 1], [], null, { event: "compare" }));
          if (a[j] <= temp) break;
          a[j + 1] = a[j];
          f.push(snap(a, 3, v, sorted, [], [j, j + 1], null, { event: "swap" }));
          j--;
        }
        a[j + 1] = temp;
        f.push(snap(a, 5, v, sorted, [j + 1], [j + 1], null, { event: "swap" }));
      }
    };

    const merge = (left: number, mid: number, right: number) => {
      const leftArr = a.slice(left, mid + 1);
      const rightArr = a.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      v.left = left; v.mid = mid; v.right = right;
      while (i < leftArr.length && j < rightArr.length) {
        f.push(snap(a, 8, v, sorted, [left + i, mid + 1 + j], [], null, { event: "compare" }));
        a[k] = leftArr[i] <= rightArr[j] ? leftArr[i++] : rightArr[j++];
        f.push(snap(a, 9, v, sorted, [k], [k], null, { event: "swap" }));
        k++;
      }
      while (i < leftArr.length) { a[k] = leftArr[i++]; f.push(snap(a, 9, v, sorted, [k], [k], null, { event: "swap" })); k++; }
      while (j < rightArr.length) { a[k] = rightArr[j++]; f.push(snap(a, 9, v, sorted, [k], [k], null, { event: "swap" })); k++; }
    };

    for (let start = 0; start < a.length; start += run) insertion(start, Math.min(start + run - 1, a.length - 1));
    for (let size = run; size < a.length; size *= 2) {
      v.size = size;
      for (let left = 0; left < a.length; left += 2 * size) {
        const mid = Math.min(left + size - 1, a.length - 1);
        const right = Math.min(left + 2 * size - 1, a.length - 1);
        if (mid < right) merge(left, mid, right);
      }
    }
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 12, v, sorted));
    return f;
  },
};
