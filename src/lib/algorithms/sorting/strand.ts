import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const strandSort: AlgoDef = {
  id: "strand",
  name: "Strand Sort",
  category: "sort",
  code: `let input = [...arr];
let output = [];
while (input.length) {
  const strand = [input.shift()];
  for (let i = 0; i < input.length;) {
    if (input[i] >= strand[strand.length - 1]) {
      strand.push(input.splice(i, 1)[0]);
    } else {
      i++;
    }
  }
  output = merge(output, strand);
}`,
  run(arr) {
    const input = [...arr];
    const output: number[] = [];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = { kind: "strand" };

    const state = (phase: string, activeBucket?: number) => ({
      buckets: {
        labels: ["input", "strand", "output"],
        buckets: [[...input], [...currentStrand], [...output]],
        activeBucket,
        phase,
      },
    });
    let currentStrand: number[] = [];
    const view = () => [...output, ...currentStrand, ...input];
    f.push(snap(view(), 0, v, sorted, [], [], null, state("start", 0)));

    while (input.length) {
      currentStrand = [input.shift()!];
      v.phase = "start strand"; v.value = currentStrand[0]; v.strandLast = currentStrand[0];
      f.push(snap(view(), 2, v, sorted, [output.length], [], null, { event: "visit", ...state("start strand", 1) }));

      for (let i = 0; i < input.length;) {
        const value = input[i];
        const last = currentStrand[currentStrand.length - 1];
        v.phase = "scan input"; v.i = i; v.value = value; v.strandLast = last;
        f.push(snap(view(), 4, v, sorted, [output.length + currentStrand.length + i], [], null, {
          event: "compare",
          ...state("scan input", 0),
        }));
        if (value >= last) {
          currentStrand.push(input.splice(i, 1)[0]);
          v.phase = "append to strand"; v.value = value; v.strandLast = value;
          f.push(snap(view(), 5, v, sorted, [output.length + currentStrand.length - 1], [output.length + currentStrand.length - 1], null, {
            event: "swap",
            ...state("append to strand", 1),
          }));
        } else {
          i++;
        }
      }

      v.phase = "merge strand"; v.strandSize = currentStrand.length; v.outputSize = output.length;
      f.push(snap(view(), 9, v, sorted, [], [], null, { event: "visit", ...state("merge strand", 2) }));
      const merged = mergeSorted(output, currentStrand);
      output.splice(0, output.length, ...merged);
      currentStrand = [];
      for (let i = 0; i < output.length; i++) sorted.add(i);
      f.push(snap(view(), 9, v, sorted, [...output.keys()], [...output.keys()], null, {
        event: "swap",
        ...state("output merged", 2),
      }));
    }

    f.push(snap([...output], 10, v, sorted, [], [], null, state("done", 2)));
    return f;
  },
};

function mergeSorted(left: number[], right: number[]) {
  const merged: number[] = [];
  let i = 0, j = 0;
  while (i < left.length || j < right.length) {
    if (j >= right.length || (i < left.length && left[i] <= right[j])) merged.push(left[i++]);
    else merged.push(right[j++]);
  }
  return merged;
}
