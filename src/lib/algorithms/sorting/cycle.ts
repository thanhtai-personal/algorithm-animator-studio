import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const cycleSort: AlgoDef = {
  id: "cycle",
  name: "Cycle Sort",
  category: "sort",
  code: `for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
  let item = arr[cycleStart];
  let pos = cycleStart;
  for (let i = cycleStart + 1; i < n; i++) {
    if (arr[i] < item) pos++;
  }
  while (item === arr[pos]) pos++;
  while (pos !== cycleStart) {
    [item, arr[pos]] = [arr[pos], item];
    pos = cycleStart;
    for (let i = cycleStart + 1; i < n; i++) {
      if (arr[i] < item) pos++;
    }
    while (item === arr[pos]) pos++;
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};

    f.push(snap(a, 0, v, sorted));
    for (let cycleStart = 0; cycleStart < a.length - 1; cycleStart++) {
      let item = a[cycleStart];
      let pos = cycleStart;
      v.cycleStart = cycleStart; v.item = item; v.pos = pos; v.phase = "count";
      f.push(snap(a, 1, v, sorted, [cycleStart], [], cycleStart));

      for (let i = cycleStart + 1; i < a.length; i++) {
        v.i = i; v.pos = pos; v.phase = "count";
        f.push(snap(a, 3, v, sorted, [cycleStart, i], [], cycleStart, { event: "compare" }));
        if (a[i] < item) {
          pos++;
          v.pos = pos;
          f.push(snap(a, 4, v, sorted, [i, pos], [], cycleStart, { event: "visit" }));
        }
      }

      if (pos === cycleStart) {
        sorted.add(cycleStart);
        f.push(snap(a, 5, v, sorted, [cycleStart], [], cycleStart));
        continue;
      }

      while (pos < a.length && item === a[pos]) {
        pos++;
        v.pos = pos; v.phase = "skip duplicate";
        f.push(snap(a, 6, v, sorted, [Math.min(pos, a.length - 1)], [], cycleStart));
      }

      if (pos < a.length) item = writeItem(a, item, pos, v, sorted, f, cycleStart);

      while (pos !== cycleStart) {
        pos = cycleStart;
        v.pos = pos; v.item = item; v.phase = "recount";
        f.push(snap(a, 8, v, sorted, [cycleStart], [], cycleStart));

        for (let i = cycleStart + 1; i < a.length; i++) {
          v.i = i; v.pos = pos;
          f.push(snap(a, 10, v, sorted, [cycleStart, i], [], cycleStart, { event: "compare" }));
          if (a[i] < item) {
            pos++;
            v.pos = pos;
            f.push(snap(a, 11, v, sorted, [i, pos], [], cycleStart, { event: "visit" }));
          }
        }

        while (pos < a.length && item === a[pos]) {
          pos++;
          v.pos = pos; v.phase = "skip duplicate";
          f.push(snap(a, 12, v, sorted, [Math.min(pos, a.length - 1)], [], cycleStart));
        }

        if (pos < a.length) item = writeItem(a, item, pos, v, sorted, f, cycleStart);
      }
      sorted.add(cycleStart);
      f.push(snap(a, 15, v, sorted, [cycleStart], [], cycleStart));
    }

    for (let i = 0; i < a.length; i++) sorted.add(i);
    f.push(snap(a, 16, v, sorted));
    return f;
  },
};

function writeItem(
  a: number[],
  item: number,
  pos: number,
  v: Record<string, number | string>,
  sorted: Set<number>,
  frames: Frame[],
  cycleStart: number,
) {
  const displaced = a[pos];
  a[pos] = item;
  sorted.add(pos);
  v.pos = pos; v.item = displaced; v.writeValue = item; v.displaced = displaced; v.phase = "write";
  frames.push(snap(a, 7, v, sorted, [cycleStart, pos], [pos], cycleStart, { event: "swap" }));
  return displaced;
}
