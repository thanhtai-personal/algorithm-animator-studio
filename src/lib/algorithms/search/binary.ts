import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const binarySearch: AlgoDef = {
  id: "binary",
  name: "Binary Search",
  category: "search",
  code: `let lo = 0, hi = n - 1;
while (lo <= hi) {
  const mid = (lo + hi) >> 1;
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}
return -1;`,
  run(arr, opts) {
    const a = [...arr].sort((x, y) => x - y);
    const target = opts?.target ?? a[Math.floor(a.length / 2)];
    const f: Frame[] = [];
    const v: Record<string, number | string> = { target };
    let lo = 0, hi = a.length - 1;
    f.push(snap(a, 0, v, new Set(), [], [], null, { target, label: "sorted" }));
    while (lo <= hi) {
      v.lo = lo; v.hi = hi;
      f.push(snap(a, 1, v, new Set(), [], [], null, { target }));
      const mid = (lo + hi) >> 1;
      v.mid = mid;
      f.push(snap(a, 3, v, new Set(), [mid], [], null, { target, event: "compare" }));
      if (a[mid] === target) {
        f.push(snap(a, 3, v, new Set([mid]), [], [], null, { target, found: mid, event: "found" }));
        return f;
      }
      if (a[mid] < target) { lo = mid + 1; f.push(snap(a, 4, v, new Set(), [], [], null, { target })); }
      else { hi = mid - 1; f.push(snap(a, 5, v, new Set(), [], [], null, { target })); }
    }
    f.push(snap(a, 7, v, new Set(), [], [], null, { target, found: -1 }));
    return f;
  },
};
