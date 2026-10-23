import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const gnomeSort: AlgoDef = {
  id: "gnome",
  name: "Gnome Sort",
  category: "sort",
  code: `let index = 0;
while (index < n) {
  if (index === 0 || arr[index] >= arr[index - 1]) {
    index++;
  } else {
    swap(index, index - 1);
    index--;
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    let index = 0;
    while (index < a.length) {
      v.index = index;
      if (index === 0) {
        f.push(snap(a, 2, v, sorted, [index], [], null));
        index++;
        continue;
      }
      f.push(snap(a, 2, v, sorted, [index - 1, index], [], null, { event: "compare" }));
      if (a[index] >= a[index - 1]) {
        index++;
      } else {
        [a[index], a[index - 1]] = [a[index - 1], a[index]];
        f.push(snap(a, 5, v, sorted, [], [index - 1, index], null, { event: "swap" }));
        index--;
      }
    }
    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 8, v, sorted));
    return f;
  },
};
