import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const flashSort: AlgoDef = {
  id: "flash",
  name: "Flash Sort",
  category: "sort",
  code: `const m = Math.floor(0.45 * n);
const min = Math.min(...arr);
const max = Math.max(...arr);
const cls = (x) => Math.floor((m - 1) * (x - min) / (max - min));

for (const value of arr) count[cls(value)]++;
prefixSum(count); // class boundaries
flashValuesIntoClassZones(arr, count);
insertionSort(arr); // cleanup inside each class`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const vars: Record<string, number | string> = { kind: "flash", phase: "start" };
    const emit = (
      line: number,
      highlight: number[] = [],
      swap: number[] = [],
      event: Frame["event"] = null,
      extra: Partial<Frame> = {},
    ) => frames.push(snap(a, line, vars, sorted, highlight, swap, null, { event, ...extra }));

    emit(0);
    if (a.length < 2) {
      a.forEach((_, index) => sorted.add(index));
      vars.phase = "done";
      emit(8);
      return frames;
    }

    let min = a[0];
    let max = a[0];
    let minIndex = 0;
    let maxIndex = 0;
    vars.phase = "find min/max";
    vars.min = min;
    vars.max = max;
    emit(1, [0]);

    for (let i = 1; i < a.length; i++) {
      if (a[i] < min) { min = a[i]; minIndex = i; }
      if (a[i] > max) { max = a[i]; maxIndex = i; }
      vars.i = i;
      vars.min = min;
      vars.max = max;
      emit(2, [i, minIndex, maxIndex], [], "compare");
    }

    if (min === max) {
      a.forEach((_, index) => sorted.add(index));
      vars.phase = "all equal";
      emit(8, allIndexes(a));
      return frames;
    }

    const classCount = Math.max(2, Math.min(a.length, Math.floor(0.45 * a.length) || 2));
    const labels = Array.from({ length: classCount }, (_, index) => `C${index}`);
    const counts = Array(classCount).fill(0);
    const classBuckets = Array.from({ length: classCount }, () => [] as number[]);
    const classOf = (value: number) => Math.min(classCount - 1, Math.floor(((classCount - 1) * (value - min)) / (max - min)));
    vars.m = classCount;
    vars.formula = "class=(m-1)*(x-min)/(max-min)";

    for (let i = 0; i < a.length; i++) {
      const cls = classOf(a[i]);
      counts[cls]++;
      classBuckets[cls].push(a[i]);
      vars.phase = "classify";
      vars.i = i;
      vars.value = a[i];
      vars.class = cls;
      vars.count = counts[cls];
      emit(4, [i], [], "visit", {
        buckets: { labels, buckets: cloneBuckets(classBuckets), activeBucket: cls, phase: "classify" },
      });
    }

    const starts = Array(classCount).fill(0);
    const ends = Array(classCount).fill(0);
    let cursor = 0;
    for (let cls = 0; cls < classCount; cls++) {
      starts[cls] = cursor;
      cursor += counts[cls];
      ends[cls] = cursor - 1;
      vars.phase = "prefix boundaries";
      vars.class = cls;
      vars.start = starts[cls];
      vars.end = ends[cls];
      emit(5, range(starts[cls], ends[cls]), [], null, {
        buckets: { labels, buckets: cloneBuckets(classBuckets), activeBucket: cls, phase: "prefix" },
      });
    }

    const byClass = classBuckets.flat();
    vars.phase = "flash into zones";
    for (let target = 0; target < byClass.length; target++) {
      const desired = byClass[target];
      const cls = classOf(desired);
      vars.class = cls;
      vars.dest = target;
      vars.start = starts[cls];
      vars.end = ends[cls];
      if (a[target] === desired) {
        emit(6, [target], [], "visit", { buckets: { labels, buckets: cloneBuckets(classBuckets), activeBucket: cls, phase: "flash" } });
        continue;
      }
      const source = findValueIndex(a, desired, target + 1);
      if (source < 0) continue;
      vars.source = source;
      [a[target], a[source]] = [a[source], a[target]];
      emit(6, [target, source], [target, source], "swap", {
        buckets: { labels, buckets: cloneBuckets(classBuckets), activeBucket: cls, phase: "flash" },
      });
    }

    vars.phase = "insertion cleanup";
    for (let i = 1; i < a.length; i++) {
      let j = i;
      vars.i = i;
      while (j > 0) {
        vars.j = j;
        emit(7, [j - 1, j], [], "compare");
        if (a[j - 1] <= a[j]) break;
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        emit(7, [j - 1, j], [j - 1, j], "swap");
        j--;
      }
    }

    a.forEach((_, index) => sorted.add(index));
    vars.phase = "done";
    emit(8);
    return frames;
  },
};

function cloneBuckets(buckets: number[][]) {
  return buckets.map((bucket) => [...bucket]);
}

function findValueIndex(values: number[], value: number, start: number) {
  for (let i = start; i < values.length; i++) {
    if (values[i] === value) return i;
  }
  return -1;
}

function range(start: number, end: number) {
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function allIndexes(values: number[]) {
  return Array.from({ length: values.length }, (_, index) => index);
}
