import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const countingSort: AlgoDef = {
  id: "counting",
  name: "Counting Sort",
  category: "sort",
  code: `const min = Math.min(...arr);
const max = Math.max(...arr);
const count = Array(max - min + 1).fill(0);
for (const value of arr) count[value - min]++;
let index = 0;
for (let bucket = 0; bucket < count.length; bucket++) {
  while (count[bucket]-- > 0) arr[index++] = bucket + min;
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    if (!a.length) return [snap(a, 0, v, sorted)];

    const min = Math.min(...a);
    const max = Math.max(...a);
    const count = Array(max - min + 1).fill(0);
    v.min = min; v.max = max;
    f.push(snap(a, 0, v, sorted));

    for (let i = 0; i < a.length; i++) {
      const bucket = a[i] - min;
      count[bucket]++;
      v.i = i; v.value = a[i]; v.bucket = bucket; v.count = count[bucket];
      f.push(snap(a, 3, v, sorted, [i], [], null, { event: "compare" }));
    }

    let index = 0;
    for (let bucket = 0; bucket < count.length; bucket++) {
      while (count[bucket] > 0) {
        a[index] = bucket + min;
        count[bucket]--;
        sorted.add(index);
        v.index = index; v.bucket = bucket; v.value = a[index]; v.count = count[bucket];
        f.push(snap(a, 6, v, sorted, [index], [index], null, { event: "swap" }));
        index++;
      }
    }
    f.push(snap(a, 7, v, sorted));
    return f;
  },
};
