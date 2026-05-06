import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const bucketSort: AlgoDef = {
  id: "bucket",
  name: "Bucket Sort",
  category: "sort",
  code: `const min = Math.min(...arr);
const max = Math.max(...arr);
const bucketCount = Math.ceil(Math.sqrt(n));
const buckets = Array.from({ length: bucketCount }, () => []);
for (const value of arr) {
  const bucketIndex = Math.floor(((value - min) / (max - min + 1)) * bucketCount);
  buckets[bucketIndex].push(value);
}
for (const bucket of buckets) bucket.sort((a, b) => a - b);
arr = buckets.flat();`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    if (!a.length) return [snap(a, 0, v, sorted)];

    const min = Math.min(...a);
    const max = Math.max(...a);
    const bucketCount = Math.max(1, Math.ceil(Math.sqrt(a.length)));
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
    const range = Math.max(1, max - min + 1);
    v.min = min; v.max = max; v.bucketCount = bucketCount;
    f.push(snap(a, 0, v, sorted));

    for (let i = 0; i < a.length; i++) {
      const bucketIndex = Math.min(bucketCount - 1, Math.floor(((a[i] - min) / range) * bucketCount));
      buckets[bucketIndex].push(a[i]);
      v.i = i; v.value = a[i]; v.bucketIndex = bucketIndex;
      f.push(snap(a, 5, v, sorted, [i], [], null, { event: "compare" }));
    }

    let index = 0;
    for (let b = 0; b < buckets.length; b++) {
      buckets[b].sort((x, y) => x - y);
      for (const value of buckets[b]) {
        a[index] = value;
        sorted.add(index);
        v.bucketIndex = b; v.index = index; v.value = value;
        f.push(snap(a, 9, v, sorted, [index], [index], null, { event: "swap" }));
        index++;
      }
    }
    f.push(snap(a, 10, v, sorted));
    return f;
  },
};
