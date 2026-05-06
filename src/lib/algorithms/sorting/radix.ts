import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const radixSort: AlgoDef = {
  id: "radix",
  name: "Radix Sort",
  category: "sort",
  code: `function lsd(values) {
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const buckets = Array.from({ length: 10 }, () => []);
    for (const value of values) buckets[Math.floor(value / exp) % 10].push(value);
    values = buckets.flat();
  }
  return values;
}
const negatives = lsd(absNegatives).reverse().map((v) => -v);
const positives = lsd(nonNegatives);
arr = [...negatives, ...positives];`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = { base: 10 };
    if (!a.length) return [snap(a, 0, v, sorted)];

    const writeBack = (values: number[], line: number, phase: string) => {
      for (let i = 0; i < values.length; i++) {
        a[i] = values[i];
        v.phase = phase; v.i = i; v.value = values[i];
        f.push(snap(a, line, v, sorted, [i], [i], null, { event: "swap" }));
      }
    };

    const sortAbs = (values: number[], phase: string) => {
      let result = [...values];
      const max = Math.max(...result, 0);
      for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        const buckets: number[][] = Array.from({ length: 10 }, () => []);
        for (let i = 0; i < result.length; i++) {
          const digit = Math.floor(result[i] / exp) % 10;
          buckets[digit].push(result[i]);
          v.phase = phase; v.exp = exp; v.digit = digit; v.bucket = digit; v.value = result[i];
          f.push(snap(a, 3, v, sorted, [i], [], null, { event: "compare" }));
        }
        result = buckets.flat();
        writeBack(result.map((n) => phase === "negative" ? -n : n), 4, phase);
      }
      return result;
    };

    const negatives = a.filter((n) => n < 0).map(Math.abs);
    const positives = a.filter((n) => n >= 0);
    const sortedNegatives = sortAbs(negatives, "negative").reverse().map((n) => -n);
    const sortedPositives = sortAbs(positives, "positive");
    const result = [...sortedNegatives, ...sortedPositives];
    for (let i = 0; i < result.length; i++) {
      a[i] = result[i];
      sorted.add(i);
      v.phase = "combine"; v.i = i; v.value = a[i];
      f.push(snap(a, 10, v, sorted, [i], [i], null, { event: "swap" }));
    }
    f.push(snap(a, 10, v, sorted));
    return f;
  },
};
