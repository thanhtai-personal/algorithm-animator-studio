import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const oddEvenSort: AlgoDef = {
  id: "odd_even",
  name: "Odd-Even Sort",
  category: "sort",
  code: `let sorted = false;
while (!sorted) {
  sorted = true;
  for (let i = 1; i < n - 1; i += 2) {
    if (arr[i] > arr[i + 1]) {
      swap(i, i + 1);
      sorted = false;
    }
  }
  for (let i = 0; i < n - 1; i += 2) {
    if (arr[i] > arr[i + 1]) {
      swap(i, i + 1);
      sorted = false;
    }
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    f.push(snap(a, 0, v, sorted));

    let done = false;
    let pass = 0;
    while (!done) {
      done = true;
      v.pass = pass;
      v.sorted = "true";
      v.phase = "odd";

      for (let i = 1; i < a.length - 1; i += 2) {
        v.i = i;
        v.j = i + 1;
        f.push(snap(a, 4, v, sorted, [i, i + 1], [], null, { event: "compare" }));
        if (a[i] > a[i + 1]) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]];
          done = false;
          v.sorted = "false";
          f.push(snap(a, 5, v, sorted, [], [i, i + 1], null, { event: "swap" }));
        }
      }

      v.phase = "even";
      for (let i = 0; i < a.length - 1; i += 2) {
        v.i = i;
        v.j = i + 1;
        f.push(snap(a, 10, v, sorted, [i, i + 1], [], null, { event: "compare" }));
        if (a[i] > a[i + 1]) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]];
          done = false;
          v.sorted = "false";
          f.push(snap(a, 11, v, sorted, [], [i, i + 1], null, { event: "swap" }));
        }
      }

      pass++;
    }

    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 15, v, sorted));
    return f;
  },
};
