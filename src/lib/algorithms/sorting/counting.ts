import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const countingSort: AlgoDef = {
  id: "counting",
  name: "Counting Sort",
  category: "sort",
  code: `const min = Math.min(...arr);
const max = Math.max(...arr);
const count = Array(max - min + 1).fill(0);
for (const value of arr) count[value - min]++;
let index = 0;
for (let bucket = 0; bucket < count.length; bucket++) {
  while (count[bucket]-- > 0) arr[index++] = bucket + min;
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    if (!a.length) return [snap(a, 0, v, sorted)];

    const source = [...a];
    const uniqueValues: number[] = [];
    const countByValue = new Map<number, number>();
    const counting = (
      phase: "collect" | "sort" | "write" | "done",
      values: number[],
      counts: number[],
      extra: Partial<NonNullable<Frame["counting"]>> = {},
    ) => ({
      counting: { source, uniqueValues: [...values], counts: [...counts], phase, ...extra },
    });
    f.push(snap(a, 0, v, sorted, [], [], null, counting("collect", uniqueValues, [])));

    for (let i = 0; i < a.length; i++) {
      const value = a[i];
      if (!countByValue.has(value)) uniqueValues.push(value);
      countByValue.set(value, (countByValue.get(value) ?? 0) + 1);
      const counts = uniqueValues.map((n) => countByValue.get(n) ?? 0);
      const uniqueIndex = uniqueValues.indexOf(value);
      v.i = i; v.value = value; v.uniqueIndex = uniqueIndex; v.count = counts[uniqueIndex];
      f.push(snap(a, 3, v, sorted, [i], [], null, {
        event: "compare",
        ...counting("collect", uniqueValues, counts, {
          activeSourceIndex: i,
          activeUniqueIndex: uniqueIndex,
          movingValue: value,
        }),
      }));
    }

    const sortedValues = [...uniqueValues].sort((x, y) => x - y);
    const sortedCounts = sortedValues.map((n) => countByValue.get(n) ?? 0);
    v.phase = "sort unique chart";
    f.push(snap(a, 4, v, sorted, [], [], null, counting("sort", sortedValues, sortedCounts)));

    let index = 0;
    const remainingCounts = [...sortedCounts];
    for (let uniqueIndex = 0; uniqueIndex < sortedValues.length; uniqueIndex++) {
      while (remainingCounts[uniqueIndex] > 0) {
        const value = sortedValues[uniqueIndex];
        a[index] = value;
        remainingCounts[uniqueIndex]--;
        sorted.add(index);
        v.index = index; v.uniqueIndex = uniqueIndex; v.value = value; v.count = remainingCounts[uniqueIndex];
        f.push(snap(a, 6, v, sorted, [index], [index], null, {
          event: "swap",
          ...counting("write", sortedValues, remainingCounts, {
            activeUniqueIndex: uniqueIndex,
            activeOutputIndex: index,
            movingValue: value,
          }),
        }));
        index++;
      }
    }
    f.push(snap(a, 7, v, sorted, [], [], null, counting("done", sortedValues, remainingCounts)));
    return f;
  },
};
