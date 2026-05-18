import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

type BitonicItem = { value: number; real: boolean };

export const bitonicSort: AlgoDef = {
  id: "bitonic",
  name: "Bitonic Sort",
  category: "sort",
  code: `function bitonicSort(lo, count, dir) {
  if (count <= 1) return;
  const k = Math.floor(count / 2);
  bitonicSort(lo, k, true);
  bitonicSort(lo + k, count - k, false);
  bitonicMerge(lo, count, dir);
}
function bitonicMerge(lo, count, dir) {
  if (count <= 1) return;
  const gap = greatestPowerOfTwoLessThan(count);
  for (let i = lo; i < lo + count - gap; i++) {
    compareAndSwap(i, i + gap, dir);
  }
  bitonicMerge(lo, gap, dir);
  bitonicMerge(lo + gap, count - gap, dir);
}`,
  run(arr) {
    const originalLength = arr.length;
    const paddedLength = nextPowerOfTwo(Math.max(1, originalLength));
    const a: BitonicItem[] = [
      ...arr.map((value) => ({ value, real: true })),
      ...Array.from({ length: paddedLength - originalLength }, () => ({ value: Number.POSITIVE_INFINITY, real: false })),
    ];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    const visibleValues = () => a.filter((item) => item.real).map((item) => item.value);
    const visibleIndex = (slot: number) => a.slice(0, slot).filter((item) => item.real).length;
    const visibleSlots = (slots: number[]) => slots.filter((slot) => a[slot]?.real).map(visibleIndex);
    const pushFrame = (line: number, highlight: number[] = [], swap: number[] = [], event: Frame["event"] = null) => {
      f.push(snap(visibleValues(), line, v, sorted, visibleSlots(highlight), visibleSlots(swap), null, { event }));
    };

    pushFrame(0);

    const compareAndSwap = (i: number, j: number, dir: boolean) => {
      v.i = i; v.j = j; v.dir = dir ? "asc" : "desc";
      if (a[i].real && a[j].real) pushFrame(10, [i, j], [], "compare");
      if ((dir && a[i].value > a[j].value) || (!dir && a[i].value < a[j].value)) {
        [a[i], a[j]] = [a[j], a[i]];
        if (a[i].real && a[j].real) pushFrame(11, [], [i, j], "swap");
      }
    };

    const bitonicMerge = (lo: number, count: number, dir: boolean) => {
      if (count <= 1) return;
      const gap = greatestPowerOfTwoLessThan(count);
      v.stage = "merge"; v.lo = lo; v.count = count; v.gap = gap; v.dir = dir ? "asc" : "desc";
      for (let i = lo; i < lo + count - gap; i++) compareAndSwap(i, i + gap, dir);
      bitonicMerge(lo, gap, dir);
      bitonicMerge(lo + gap, count - gap, dir);
    };

    const sortRange = (lo: number, count: number, dir: boolean) => {
      if (count <= 1) return;
      const k = Math.floor(count / 2);
      v.stage = "split"; v.lo = lo; v.count = count; v.mid = lo + k; v.dir = dir ? "asc" : "desc";
      pushFrame(2, range(lo, lo + count - 1));
      sortRange(lo, k, true);
      sortRange(lo + k, count - k, false);
      bitonicMerge(lo, count, dir);
    };

    sortRange(0, a.length, true);
    for (let i = 0; i < originalLength; i++) sorted.add(i);
    pushFrame(18);
    return f;
  },
};

function nextPowerOfTwo(n: number) {
  let value = 1;
  while (value < n) value *= 2;
  return value;
}

function greatestPowerOfTwoLessThan(n: number) {
  let value = 1;
  while (value * 2 < n) value *= 2;
  return value;
}

function range(start: number, end: number) {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}
