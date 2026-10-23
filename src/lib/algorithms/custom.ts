import { snap } from "./frame";
import type { AlgoDef, Frame } from "./types";

export const customAlgo: AlgoDef = {
  id: "custom",
  name: "Custom Code",
  category: "custom",
  code: `// Custom bubble sort
// API: vis.compare(i,j), vis.swap(i,j), vis.mark(...idx),
//      vis.markSorted(i), vis.set(i,v), vis.label(text),
//      vis.snapshot()
// Available: arr, n, vis
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    vis.compare(j, j + 1);
    if (arr[j] > arr[j + 1]) vis.swap(j, j + 1);
  }
  vis.markSorted(n - i - 1);
}`,
  run(arr, opts) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    let line = 0;
    let label = "";
    const push = (ev: Frame["event"] = null, hi: number[] = [], sw: number[] = []) => {
      f.push(snap(a, line, v, sorted, hi, sw, null, { event: ev, label }));
    };
    const vis = {
      compare: (i: number, j: number) => { line = 0; push("compare", [i, j]); },
      swap: (i: number, j: number) => {
        [a[i], a[j]] = [a[j], a[i]];
        line = 0; push("swap", [], [i, j]);
      },
      mark: (...idx: number[]) => { push(null, idx); },
      markSorted: (i: number) => { sorted.add(i); push(); },
      set: (i: number, val: number) => { a[i] = val; push("swap", [i]); },
      label: (text: string) => { label = text; v.label = text; push(); },
      snapshot: () => push(),
    };
    try {
      const code = opts?.customCode ?? customAlgo.code;
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const fn = new Function("arr", "n", "vis", code);
      fn(a, a.length, vis);
    } catch (e) {
      console.error("Custom code error:", e);
      v.error = (e as Error).message;
      push();
    }
    push();
    return f;
  },
};
