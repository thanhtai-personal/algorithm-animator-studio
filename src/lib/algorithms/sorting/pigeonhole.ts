import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const pigeonholeSort: AlgoDef = {
  id: "pigeonhole",
  name: "Pigeonhole Sort",
  category: "sort",
  code: `const min = Math.min(...arr);
const max = Math.max(...arr);
const holes = Array.from({ length: max - min + 1 }, () => []);
for (const value of arr) {
  holes[value - min].push(value);
}
let index = 0;
for (let hole = 0; hole < holes.length; hole++) {
  while (holes[hole].length) arr[index++] = holes[hole].pop();
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = { kind: "pigeonhole" };
    if (!a.length) return [snap(a, 0, v, sorted)];

    const source = [...a];
    const min = Math.min(...a);
    const max = Math.max(...a);
    const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const counts = Array(values.length).fill(0);
    const counting = (
      phase: "collect" | "write" | "done",
      extra: Partial<NonNullable<Frame["counting"]>> = {},
    ) => ({
      counting: { source, uniqueValues: values, counts: [...counts], phase, ...extra },
    });

    v.min = min; v.max = max; v.range = values.length;
    f.push(snap(a, 0, v, sorted, [], [], null, counting("collect")));

    for (let i = 0; i < source.length; i++) {
      const value = source[i];
      const hole = value - min;
      counts[hole]++;
      v.i = i; v.value = value; v.hole = hole; v.count = counts[hole];
      f.push(snap(a, 3, v, sorted, [i], [], null, {
        event: "compare",
        ...counting("collect", {
          activeSourceIndex: i,
          activeUniqueIndex: hole,
          movingValue: value,
        }),
      }));
    }

    let index = 0;
    for (let hole = 0; hole < counts.length; hole++) {
      while (counts[hole] > 0) {
        const value = hole + min;
        a[index] = value;
        counts[hole]--;
        sorted.add(index);
        v.index = index; v.value = value; v.hole = hole; v.count = counts[hole];
        f.push(snap(a, 7, v, sorted, [index], [index], null, {
          event: "swap",
          ...counting("write", {
            activeUniqueIndex: hole,
            activeOutputIndex: index,
            movingValue: value,
          }),
        }));
        index++;
      }
    }

    f.push(snap(a, 8, v, sorted, [], [], null, counting("done")));
    return f;
  },
};
