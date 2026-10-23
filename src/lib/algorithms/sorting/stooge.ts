import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const stoogeSort: AlgoDef = {
  id: "stooge",
  name: "Stooge Sort",
  category: "sort",
  code: `function stoogeSort(lo, hi) {
  if (arr[lo] > arr[hi]) swap(lo, hi);
  if (hi - lo + 1 > 2) {
    const third = Math.floor((hi - lo + 1) / 3);
    stoogeSort(lo, hi - third);
    stoogeSort(lo + third, hi);
    stoogeSort(lo, hi - third);
  }
}`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = { kind: "stooge", phase: "start", depth: 0 };
    const maxFrames = 900;

    const emit = (line: number, highlight: number[], swap: number[] = [], event: Frame["event"] = null) => {
      if (frames.length >= maxFrames) return;
      frames.push(snap(a, line, v, sorted, highlight, swap, null, { event }));
    };

    const sort = (lo: number, hi: number, depth: number) => {
      if (lo >= hi || frames.length >= maxFrames) return;
      const length = hi - lo + 1;
      v.phase = "compare ends"; v.lo = lo; v.hi = hi; v.depth = depth; v.length = length;
      emit(1, [lo, hi], [], "compare");

      if (a[lo] > a[hi]) {
        [a[lo], a[hi]] = [a[hi], a[lo]];
        v.phase = "swap ends";
        emit(2, [lo, hi], [lo, hi], "swap");
      }

      if (length > 2) {
        const third = Math.floor(length / 3);
        v.third = third;
        v.phase = "left 2/3";
        emit(5, range(lo, hi - third), [], "visit");
        sort(lo, hi - third, depth + 1);

        v.phase = "right 2/3";
        emit(6, range(lo + third, hi), [], "visit");
        sort(lo + third, hi, depth + 1);

        v.phase = "left 2/3 again";
        emit(7, range(lo, hi - third), [], "visit");
        sort(lo, hi - third, depth + 1);
      }
    };

    emit(0, []);
    sort(0, a.length - 1, 0);
    for (let i = 0; i < a.length; i++) sorted.add(i);
    v.phase = "done";
    emit(8, [], [], null);
    return frames;
  },
};

function range(lo: number, hi: number) {
  return Array.from({ length: hi - lo + 1 }, (_, index) => lo + index);
}
