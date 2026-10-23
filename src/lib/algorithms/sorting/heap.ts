import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const heapSort: AlgoDef = {
  id: "heap",
  name: "Heap Sort",
  category: "sort",
  code: `function heapify(n, i) {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(n, largest);
  }
}
for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
for (let end = n - 1; end > 0; end--) {
  [arr[0], arr[end]] = [arr[end], arr[0]];
  heapify(end, 0);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};

    const heapify = (n: number, i: number) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      v.n = n; v.i = i; v.largest = largest; v.left = left; v.right = right;
      f.push(snap(a, 1, v, sorted, [i], [], largest));

      if (left < n) {
        f.push(snap(a, 4, v, sorted, [left, largest], [], largest, { event: "compare" }));
        if (a[left] > a[largest]) {
          largest = left;
          v.largest = largest;
          f.push(snap(a, 4, v, sorted, [largest], [], largest));
        }
      }
      if (right < n) {
        f.push(snap(a, 5, v, sorted, [right, largest], [], largest, { event: "compare" }));
        if (a[right] > a[largest]) {
          largest = right;
          v.largest = largest;
          f.push(snap(a, 5, v, sorted, [largest], [], largest));
        }
      }
      if (largest !== i) {
        [a[i], a[largest]] = [a[largest], a[i]];
        f.push(snap(a, 7, v, sorted, [], [i, largest], largest, { event: "swap" }));
        heapify(n, largest);
      }
    };

    f.push(snap(a, 11, v, sorted));
    for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) {
      v.i = i;
      heapify(a.length, i);
    }
    for (let end = a.length - 1; end > 0; end--) {
      v.end = end;
      [a[0], a[end]] = [a[end], a[0]];
      f.push(snap(a, 13, v, sorted, [], [0, end], null, { event: "swap" }));
      sorted.add(end);
      f.push(snap(a, 14, v, sorted, [0], [], null));
      heapify(end, 0);
    }
    if (a.length) sorted.add(0);
    f.push(snap(a, 15, v, sorted));
    return f;
  },
};
