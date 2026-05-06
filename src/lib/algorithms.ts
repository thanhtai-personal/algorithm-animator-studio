export type Frame = {
  arr: number[];
  highlight: number[];
  swap: number[];
  sorted: number[];
  pivot: number | null;
  line: number;
  vars: Record<string, number>;
};

export type AlgoDef = {
  id: string;
  name: string;
  code: string;
  run: (arr: number[]) => Frame[];
};

const snap = (
  arr: number[],
  line: number,
  vars: Record<string, number>,
  sorted: Set<number>,
  highlight: number[] = [],
  swap: number[] = [],
  pivot: number | null = null,
): Frame => ({
  arr: [...arr],
  highlight,
  swap,
  sorted: [...sorted],
  pivot,
  line,
  vars: { ...vars },
});

const bubbleSort: AlgoDef = {
  id: "bubble",
  name: "Bubble Sort",
  code: `// Helpers: compare(i,j), swap(i,j), markSorted(i), setPivot(i),
// setVar(name,val), setLine(n). 'arr' is the input array.
for (let i = 0; i < arr.length; i++) {
  setVar('i', i);
  setLine(1);
  for (let j = 0; j < arr.length - i - 1; j++) {
    setVar('j', j);
    setLine(2);
    compare(j, j + 1);
    if (arr[j] > arr[j + 1]) {
      setLine(3);
      swap(j, j + 1);
    }
  }
  markSorted(arr.length - i - 1);
}
for (let k = 0; k < arr.length; k++) markSorted(k);`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const vars: Record<string, number> = {};
    frames.push(snap(a, 0, vars, sorted));
    for (let i = 0; i < a.length; i++) {
      vars.i = i;
      frames.push(snap(a, 1, vars, sorted));
      for (let j = 0; j < a.length - i - 1; j++) {
        vars.j = j;
        frames.push(snap(a, 2, vars, sorted, [j, j + 1]));
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          frames.push(snap(a, 3, vars, sorted, [], [j, j + 1]));
        }
      }
      sorted.add(a.length - i - 1);
      frames.push(snap(a, 4, vars, sorted));
    }
    for (let k = 0; k < a.length; k++) sorted.add(k);
    frames.push(snap(a, 6, vars, sorted));
    return frames;
  },
};

const selectionSort: AlgoDef = {
  id: "selection",
  name: "Selection Sort",
  code: `for (let i = 0; i < arr.length; i++) {
  setVar('i', i);
  setLine(1);
  let min = i;
  setVar('min', min);
  for (let j = i + 1; j < arr.length; j++) {
    setVar('j', j);
    setLine(2);
    compare(j, min);
    if (arr[j] < arr[min]) {
      min = j;
      setVar('min', min);
      setLine(3);
    }
  }
  if (min !== i) swap(i, min);
  markSorted(i);
}`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const vars: Record<string, number> = {};
    frames.push(snap(a, 0, vars, sorted));
    for (let i = 0; i < a.length; i++) {
      vars.i = i;
      frames.push(snap(a, 1, vars, sorted));
      let min = i;
      vars.min = min;
      for (let j = i + 1; j < a.length; j++) {
        vars.j = j;
        frames.push(snap(a, 2, vars, sorted, [j, min]));
        if (a[j] < a[min]) {
          min = j;
          vars.min = min;
          frames.push(snap(a, 3, vars, sorted, [min]));
        }
      }
      if (min !== i) {
        [a[i], a[min]] = [a[min], a[i]];
        frames.push(snap(a, 5, vars, sorted, [], [i, min]));
      }
      sorted.add(i);
      frames.push(snap(a, 6, vars, sorted));
    }
    return frames;
  },
};

const insertionSort: AlgoDef = {
  id: "insertion",
  name: "Insertion Sort",
  code: `for (let i = 1; i < arr.length; i++) {
  setVar('i', i);
  setLine(1);
  let key = arr[i];
  let j = i - 1;
  setVar('j', j);
  while (j >= 0 && arr[j] > key) {
    setLine(2);
    arr[j + 1] = arr[j];
    j--;
    setVar('j', j);
  }
  arr[j + 1] = key;
  setLine(3);
}`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>([0]);
    const vars: Record<string, number> = {};
    frames.push(snap(a, 0, vars, sorted));
    for (let i = 1; i < a.length; i++) {
      vars.i = i;
      frames.push(snap(a, 1, vars, sorted, [i]));
      const key = a[i];
      let j = i - 1;
      vars.j = j;
      while (j >= 0 && a[j] > key) {
        frames.push(snap(a, 2, vars, sorted, [j], [j, j + 1]));
        a[j + 1] = a[j];
        j--;
        vars.j = j;
      }
      a[j + 1] = key;
      sorted.add(i);
      frames.push(snap(a, 3, vars, sorted));
    }
    return frames;
  },
};

const quickSort: AlgoDef = {
  id: "quick",
  name: "Quick Sort",
  code: `function quick(lo, hi) {
  if (lo >= hi) { if (lo === hi) markSorted(lo); return; }
  setLine(1);
  const pivot = arr[hi];
  setPivot(hi);
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    setLine(2);
    compare(j, hi);
    if (arr[j] < pivot) {
      i++;
      setLine(3);
      swap(i, j);
    }
  }
  swap(i + 1, hi);
  markSorted(i + 1);
  quick(lo, i);
  quick(i + 2, hi);
}
quick(0, arr.length - 1);`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const vars: Record<string, number> = {};
    frames.push(snap(a, 0, vars, sorted));
    const quick = (lo: number, hi: number) => {
      if (lo >= hi) {
        if (lo === hi) {
          sorted.add(lo);
          frames.push(snap(a, 0, vars, sorted));
        }
        return;
      }
      vars.lo = lo;
      vars.hi = hi;
      frames.push(snap(a, 1, vars, sorted, [], [], hi));
      const pivot = a[hi];
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        vars.j = j;
        frames.push(snap(a, 2, vars, sorted, [j], [], hi));
        if (a[j] < pivot) {
          i++;
          vars.i = i;
          [a[i], a[j]] = [a[j], a[i]];
          frames.push(snap(a, 3, vars, sorted, [], [i, j], hi));
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      frames.push(snap(a, 5, vars, sorted, [], [i + 1, hi]));
      sorted.add(i + 1);
      frames.push(snap(a, 6, vars, sorted));
      quick(lo, i);
      quick(i + 2, hi);
    };
    quick(0, a.length - 1);
    for (let k = 0; k < a.length; k++) sorted.add(k);
    frames.push(snap(a, 0, vars, sorted));
    return frames;
  },
};

export const ALGORITHMS: Record<string, AlgoDef> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  quick: quickSort,
};
