import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const linearSearch: AlgoDef = {
  id: "linear",
  name: "Linear Search",
  category: "search",
  code: `for (let i = 0; i < n; i++) {
  if (arr[i] === target) return i;
}
return -1;`,
  run(arr, opts) {
    const target = opts?.target ?? arr[Math.floor(arr.length / 2)];
    const a = [...arr];
    const f: Frame[] = [];
    const v: Record<string, number | string> = { target };
    for (let i = 0; i < a.length; i++) {
      v.i = i;
      f.push(snap(a, 1, v, new Set(), [i], [], null, { target, event: "compare" }));
      if (a[i] === target) {
        f.push(snap(a, 1, v, new Set([i]), [], [], null, { target, found: i, event: "found" }));
        return f;
      }
    }
    f.push(snap(a, 3, v, new Set(), [], [], null, { target, found: -1 }));
    return f;
  },
};
