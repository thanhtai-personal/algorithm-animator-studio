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
  const hole = value - min;
  holes[hole].push(value);
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
    let values: number[] = [];
    let counts: number[] = [];
    const counting = (
      phase: "init" | "collect" | "write" | "done",
      extra: Partial<NonNullable<Frame["counting"]>> = {},
      displayCounts = counts,
    ) => ({
      counting: { source, uniqueValues: values, counts: [...displayCounts], phase, ...extra },
    });

    let min = source[0], max = source[0], minIndex = 0, maxIndex = 0;
    v.phase = "find min"; v.min = min; v.formula = `start min = ${min}`;
    f.push(snap(a, 0, v, sorted, [0], [], null, counting("init", { activeSourceIndex: 0 })));
    for (let i = 1; i < source.length; i++) {
      if (source[i] < min) { min = source[i]; minIndex = i; }
      v.i = i; v.value = source[i]; v.min = min; v.phase = "find min"; v.formula = `scan min: current min = ${min}`;
      f.push(snap(a, 1, v, sorted, [i, minIndex], [], null, {
        event: "compare",
        ...counting("init", { activeSourceIndex: i }),
      }));
    }

    values = [min];
    counts = [0];
    v.hole = 0; v.holeValue = min; v.phase = "place min"; v.formula = `min ${min} -> first hole`;
    f.push(snap(a, 1, v, sorted, [minIndex], [], null, {
      event: "visit",
      ...counting("init", { activeSourceIndex: minIndex, activeUniqueIndex: 0, movingValue: min }),
    }));

    v.phase = "find max"; v.max = max; v.formula = `start max = ${max}`;
    f.push(snap(a, 1, v, sorted, [0], [], null, counting("init", { activeSourceIndex: 0 })));
    for (let i = 1; i < source.length; i++) {
      if (source[i] > max) { max = source[i]; maxIndex = i; }
      v.i = i; v.value = source[i]; v.max = max; v.phase = "find max"; v.formula = `scan max: current max = ${max}`;
      f.push(snap(a, 1, v, sorted, [i, maxIndex], [], null, {
        event: "compare",
        ...counting("init", { activeSourceIndex: i }),
      }));
    }

    values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    counts = Array(values.length).fill(0);
    const createdCounts = Array(values.length).fill(-1);
    v.min = min; v.max = max; v.range = values.length;
    createdCounts[0] = 0;
    if (values.length > 1) {
      createdCounts[values.length - 1] = 0;
      v.hole = values.length - 1; v.holeValue = max; v.phase = "place max"; v.formula = `max ${max} -> last hole`;
      f.push(snap(a, 1, v, sorted, [], [], null, {
        event: "visit",
        ...counting("init", { activeSourceIndex: maxIndex, activeUniqueIndex: values.length - 1, movingValue: max }, createdCounts),
      }));
    }
    for (let hole = 1; hole < values.length - 1; hole++) {
      createdCounts[hole] = 0;
      v.hole = hole; v.holeValue = values[hole]; v.phase = "create middle hole";
      v.formula = `insert hole ${hole} for value ${values[hole]}`;
      f.push(snap(a, 1, v, sorted, [], [], null, {
        event: "visit",
        ...counting("init", { activeUniqueIndex: hole }, createdCounts),
      }));
    }

    for (let i = 0; i < source.length; i++) {
      const value = source[i];
      const hole = value - min;
      v.i = i; v.value = value; v.hole = hole; v.phase = "locate"; v.formula = `${value} - ${min} = ${hole}`;
      f.push(snap(a, 2, v, sorted, [i], [], null, {
        event: "visit",
        ...counting("collect", {
          activeSourceIndex: i,
          activeUniqueIndex: hole,
          movingValue: value,
        }),
      }));
      counts[hole]++;
      v.count = counts[hole]; v.phase = "drop";
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
