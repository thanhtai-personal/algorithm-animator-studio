export type GraphNode = { id: number; x: number; y: number; label?: string };
export type GraphEdge = { a: number; b: number; w?: number };
export type GraphState = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  visited?: number[];
  current?: number | null;
  path?: number[];
  dist?: Record<number, number | string>;
  activeEdge?: [number, number] | null;
  start?: number;
  end?: number;
  pathEdges?: [number, number][];
};

export type Frame = {
  arr: number[];
  highlight: number[];
  swap: number[];
  sorted: number[];
  pivot: number | null;
  line: number;
  vars: Record<string, number | string>;
  graph?: GraphState;
  target?: number;
  found?: number | null;
  label?: string;
  // event hints for SFX
  event?: "compare" | "swap" | "found" | "visit" | null;
};

export type AlgoCategory = "sort" | "search" | "graph" | "custom";
export type Complexity = { time: string; best?: string; worst?: string; space: string };
export type AlgoDef = {
  id: string;
  name: string;
  category: AlgoCategory;
  code: string;
  complexity?: Complexity;
  run: (arr: number[], opts?: { target?: number; customCode?: string; graph?: GraphState; start?: number; end?: number }) => Frame[];
};

export const COMPLEXITY: Record<string, Complexity> = {
  bubble:    { time: "O(n²)", best: "O(n)",     worst: "O(n²)",     space: "O(1)" },
  selection: { time: "O(n²)", best: "O(n²)",    worst: "O(n²)",     space: "O(1)" },
  insertion: { time: "O(n²)", best: "O(n)",     worst: "O(n²)",     space: "O(1)" },
  quick:     { time: "O(n log n)", best: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  merge:     { time: "O(n log n)", best: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  heap:      { time: "O(n log n)", best: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
  linear:    { time: "O(n)",       best: "O(1)",       worst: "O(n)",       space: "O(1)" },
  binary:    { time: "O(log n)",   best: "O(1)",       worst: "O(log n)",   space: "O(1)" },
  bfs:       { time: "O(V + E)",   space: "O(V)" },
  dfs:       { time: "O(V + E)",   space: "O(V)" },
  dijkstra:  { time: "O((V+E) log V)", space: "O(V)" },
  custom:    { time: "—", space: "—" },
};

const snap = (
  arr: number[],
  line: number,
  vars: Record<string, number | string>,
  sorted: Set<number>,
  highlight: number[] = [],
  swap: number[] = [],
  pivot: number | null = null,
  extra: Partial<Frame> = {},
): Frame => ({
  arr: [...arr],
  highlight,
  swap,
  sorted: [...sorted],
  pivot,
  line,
  vars: { ...vars },
  event: null,
  ...extra,
});

/* ---------------- SORTING ---------------- */

const bubbleSort: AlgoDef = {
  id: "bubble",
  name: "Bubble Sort",
  category: "sort",
  code: `for (let i = 0; i < n; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
    }
  }
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    f.push(snap(a, 0, v, sorted));
    for (let i = 0; i < a.length; i++) {
      v.i = i;
      for (let j = 0; j < a.length - i - 1; j++) {
        v.j = j;
        f.push(snap(a, 2, v, sorted, [j, j + 1], [], null, { event: "compare" }));
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          f.push(snap(a, 3, v, sorted, [], [j, j + 1], null, { event: "swap" }));
        }
      }
      sorted.add(a.length - i - 1);
      f.push(snap(a, 5, v, sorted));
    }
    for (let k = 0; k < a.length; k++) sorted.add(k);
    f.push(snap(a, 6, v, sorted));
    return f;
  },
};

const selectionSort: AlgoDef = {
  id: "selection",
  name: "Selection Sort",
  category: "sort",
  code: `for (let i = 0; i < n; i++) {
  let min = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[min]) min = j;
  }
  if (min !== i) [arr[i], arr[min]] = [arr[min], arr[i]];
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    for (let i = 0; i < a.length; i++) {
      v.i = i;
      let min = i;
      v.min = min;
      f.push(snap(a, 1, v, sorted, [i], [], null));
      for (let j = i + 1; j < a.length; j++) {
        v.j = j;
        f.push(snap(a, 3, v, sorted, [j, min], [], null, { event: "compare" }));
        if (a[j] < a[min]) {
          min = j;
          v.min = min;
        }
      }
      if (min !== i) {
        [a[i], a[min]] = [a[min], a[i]];
        f.push(snap(a, 5, v, sorted, [], [i, min], null, { event: "swap" }));
      }
      sorted.add(i);
      f.push(snap(a, 6, v, sorted));
    }
    return f;
  },
};

const insertionSort: AlgoDef = {
  id: "insertion",
  name: "Insertion Sort",
  category: "sort",
  code: `for (let i = 1; i < n; i++) {
  let key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j--;
  }
  arr[j + 1] = key;
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>([0]);
    const v: Record<string, number | string> = {};
    for (let i = 1; i < a.length; i++) {
      v.i = i;
      const key = a[i];
      v.key = key;
      f.push(snap(a, 1, v, sorted, [i], [], null));
      let j = i - 1;
      v.j = j;
      f.push(snap(a, 3, v, sorted, [j, i], [], null, { event: "compare" }));
      while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j];
        f.push(snap(a, 4, v, sorted, [], [j, j + 1], null, { event: "swap" }));
        j--;
        v.j = j;
        f.push(snap(a, 3, v, sorted, [Math.max(j, 0), j + 1], [], null, { event: "compare" }));
      }
      a[j + 1] = key;
      sorted.add(i);
      f.push(snap(a, 7, v, sorted));
    }
    return f;
  },
};

const quickSort: AlgoDef = {
  id: "quick",
  name: "Quick Sort",
  category: "sort",
  code: `function quick(lo, hi) {
  if (lo >= hi) return;
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
  quick(lo, i);
  quick(i + 2, hi);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    const quick = (lo: number, hi: number) => {
      f.push(snap(a, 0, v, sorted, [], [], hi >= 0 && hi < a.length ? hi : null));
      if (lo > hi) return;
      if (lo === hi) {
        sorted.add(lo);
        f.push(snap(a, 1, v, sorted));
        return;
      }
      v.lo = lo;
      v.hi = hi;
      const pivot = a[hi];
      v.pivot = pivot;
      f.push(snap(a, 2, v, sorted, [], [], hi));
      let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        v.j = j;
        f.push(snap(a, 5, v, sorted, [j], [], hi, { event: "compare" }));
        if (a[j] < pivot) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
          f.push(snap(a, 7, v, sorted, [], [i, j], hi, { event: "swap" }));
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      f.push(snap(a, 10, v, sorted, [], [i + 1, hi], null, { event: "swap" }));
      sorted.add(i + 1);
      quick(lo, i);
      quick(i + 2, hi);
    };
    quick(0, a.length - 1);
    for (let k = 0; k < a.length; k++) sorted.add(k);
    f.push(snap(a, 13, v, sorted));
    return f;
  },
};

const mergeSort: AlgoDef = {
  id: "merge",
  name: "Merge Sort",
  category: "sort",
  code: `function merge(lo, mid, hi) {
  const tmp = [];
  let i = lo, j = mid + 1;
  while (i <= mid && j <= hi)
    tmp.push(arr[i] <= arr[j] ? arr[i++] : arr[j++]);
  while (i <= mid) tmp.push(arr[i++]);
  while (j <= hi) tmp.push(arr[j++]);
  for (let k = 0; k < tmp.length; k++) arr[lo + k] = tmp[k];
}
function ms(lo, hi) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  ms(lo, mid); ms(mid + 1, hi);
  merge(lo, mid, hi);
}`,
  run(arr) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    const merge = (lo: number, mid: number, hi: number) => {
      const tmp: number[] = [];
      let i = lo, j = mid + 1;
      while (i <= mid && j <= hi) {
        v.i = i; v.j = j;
        f.push(snap(a, 4, v, sorted, [i, j], [], null, { event: "compare" }));
        if (a[i] <= a[j]) tmp.push(a[i++]); else tmp.push(a[j++]);
      }
      while (i <= mid) tmp.push(a[i++]);
      while (j <= hi) tmp.push(a[j++]);
      for (let k = 0; k < tmp.length; k++) {
        a[lo + k] = tmp[k];
        f.push(snap(a, 7, v, sorted, [lo + k], [], null, { event: "swap" }));
      }
    };
    const ms = (lo: number, hi: number) => {
      if (lo >= hi) { if (lo === hi) sorted.add(lo); return; }
      const mid = (lo + hi) >> 1;
      v.lo = lo; v.hi = hi; v.mid = mid;
      f.push(snap(a, 11, v, sorted));
      ms(lo, mid); ms(mid + 1, hi);
      merge(lo, mid, hi);
      for (let k = lo; k <= hi; k++) sorted.add(k);
      f.push(snap(a, 13, v, sorted));
    };
    ms(0, a.length - 1);
    for (let k = 0; k < a.length; k++) sorted.add(k);
    f.push(snap(a, 13, v, sorted));
    return f;
  },
};

const heapSort: AlgoDef = {
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

/* ---------------- SEARCH ---------------- */

const linearSearch: AlgoDef = {
  id: "linear",
  name: "Linear Search",
  category: "search",
  code: `for (let i = 0; i < n; i++) {
  if (arr[i] === target) return i;
}
return -1;`,
  run(arr, opts) {
    const target = opts?.target ?? arr[Math.floor(arr.length / 2)];
    const a = [...arr];
    const f: Frame[] = [];
    const v: Record<string, number | string> = { target };
    for (let i = 0; i < a.length; i++) {
      v.i = i;
      f.push(snap(a, 1, v, new Set(), [i], [], null, { target, event: "compare" }));
      if (a[i] === target) {
        f.push(snap(a, 1, v, new Set([i]), [], [], null, { target, found: i, event: "found" }));
        return f;
      }
    }
    f.push(snap(a, 3, v, new Set(), [], [], null, { target, found: -1 }));
    return f;
  },
};

const binarySearch: AlgoDef = {
  id: "binary",
  name: "Binary Search",
  category: "search",
  code: `let lo = 0, hi = n - 1;
while (lo <= hi) {
  const mid = (lo + hi) >> 1;
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}
return -1;`,
  run(arr, opts) {
    const a = [...arr].sort((x, y) => x - y);
    const target = opts?.target ?? a[Math.floor(a.length / 2)];
    const f: Frame[] = [];
    const v: Record<string, number | string> = { target };
    let lo = 0, hi = a.length - 1;
    f.push(snap(a, 0, v, new Set(), [], [], null, { target, label: "sorted" }));
    while (lo <= hi) {
      v.lo = lo; v.hi = hi;
      f.push(snap(a, 1, v, new Set(), [], [], null, { target }));
      const mid = (lo + hi) >> 1;
      v.mid = mid;
      f.push(snap(a, 3, v, new Set(), [mid], [], null, { target, event: "compare" }));
      if (a[mid] === target) {
        f.push(snap(a, 3, v, new Set([mid]), [], [], null, { target, found: mid, event: "found" }));
        return f;
      }
      if (a[mid] < target) { lo = mid + 1; f.push(snap(a, 4, v, new Set(), [], [], null, { target })); }
      else { hi = mid - 1; f.push(snap(a, 5, v, new Set(), [], [], null, { target })); }
    }
    f.push(snap(a, 7, v, new Set(), [], [], null, { target, found: -1 }));
    return f;
  },
};

/* ---------------- GRAPH ---------------- */

export function makeSampleGraph(): GraphState {
  // 8 nodes positioned on a normalized 0..1 grid
  const nodes: GraphNode[] = [
    { id: 0, x: 0.15, y: 0.2, label: "A" },
    { id: 1, x: 0.45, y: 0.15, label: "B" },
    { id: 2, x: 0.78, y: 0.22, label: "C" },
    { id: 3, x: 0.2, y: 0.55, label: "D" },
    { id: 4, x: 0.5, y: 0.5, label: "E" },
    { id: 5, x: 0.82, y: 0.55, label: "F" },
    { id: 6, x: 0.32, y: 0.85, label: "G" },
    { id: 7, x: 0.7, y: 0.85, label: "H" },
  ];
  const edges: GraphEdge[] = [
    { a: 0, b: 1, w: 4 }, { a: 0, b: 3, w: 2 }, { a: 1, b: 2, w: 3 },
    { a: 1, b: 4, w: 5 }, { a: 2, b: 5, w: 2 }, { a: 3, b: 4, w: 1 },
    { a: 3, b: 6, w: 6 }, { a: 4, b: 5, w: 4 }, { a: 4, b: 7, w: 3 },
    { a: 5, b: 7, w: 2 }, { a: 6, b: 7, w: 5 },
  ];
  return { nodes, edges };
}

function adjacency(g: GraphState, weighted = false) {
  const adj: Record<number, { to: number; w: number }[]> = {};
  g.nodes.forEach((n) => (adj[n.id] = []));
  g.edges.forEach((e) => {
    adj[e.a].push({ to: e.b, w: weighted ? e.w ?? 1 : 1 });
    adj[e.b].push({ to: e.a, w: weighted ? e.w ?? 1 : 1 });
  });
  return adj;
}

const bfs: AlgoDef = {
  id: "bfs",
  name: "BFS",
  category: "graph",
  code: `const queue = [start];
const visited = new Set([start]);
while (queue.length) {
  const u = queue.shift();
  for (const v of adj[u]) {
    if (!visited.has(v)) {
      visited.add(v);
      queue.push(v);
    }
  }
}`,
  run(_arr, opts) {
    const g = opts?.graph ?? makeSampleGraph();
    const adj = adjacency(g);
    const start = opts?.start ?? 0, end = opts?.end ?? g.nodes.length - 1;
    const f: Frame[] = [];
    const v: Record<string, number | string> = { start, end };
    const visited: number[] = [];
    const parent: Record<number, number> = {};
    const queue = [start];
    visited.push(start);
    const push = (line: number, current: number | null, edge: [number, number] | null = null, ev: Frame["event"] = null, pathEdges?: [number, number][]) => {
      v.queue = `[${queue.join(",")}]`;
      v.visited = visited.length;
      f.push({
        arr: [], highlight: [], swap: [], sorted: [], pivot: null,
        line, vars: { ...v }, event: ev,
        graph: { ...g, visited: [...visited], current, activeEdge: edge, start, end, pathEdges },
      });
    };
    push(0, start);
    let found = false;
    while (queue.length && !found) {
      const u = queue.shift()!;
      push(3, u, null, "visit");
      for (const { to } of adj[u]) {
        push(4, u, [u, to], "compare");
        if (!visited.includes(to)) {
          visited.push(to);
          parent[to] = u;
          queue.push(to);
          push(6, to, [u, to], "visit");
          if (to === end) { found = true; break; }
        }
      }
    }
    // reconstruct path
    const path: number[] = [];
    if (visited.includes(end)) {
      let cur: number | undefined = end;
      while (cur !== undefined) { path.unshift(cur); cur = parent[cur]; if (cur === start) { path.unshift(start); break; } }
    }
    const pathEdges: [number, number][] = [];
    for (let i = 0; i < path.length - 1; i++) pathEdges.push([path[i], path[i + 1]]);
    const lbl = (id: number) => g.nodes[id]?.label ?? String(id);
    const pathStr = path.map(lbl).join(" → ");
    v.path = pathStr || "none";
    v.task = `BFS: shortest unweighted path ${lbl(start)} → ${lbl(end)}`;
    v.label = path.length
      ? `Shortest path (BFS) ${lbl(start)}→${lbl(end)}: ${pathStr} • ${path.length - 1} edges`
      : `BFS: no path from ${lbl(start)} to ${lbl(end)}`;
    push(0, null, null, "found", pathEdges);
    push(0, null, null, "found", pathEdges);
    return f;
  },
};

const dfs: AlgoDef = {
  id: "dfs",
  name: "DFS",
  category: "graph",
  code: `function dfs(u) {
  visited.add(u);
  for (const v of adj[u]) {
    if (!visited.has(v)) dfs(v);
  }
}`,
  run(_arr, opts) {
    const g = opts?.graph ?? makeSampleGraph();
    const adj = adjacency(g);
    const start = opts?.start ?? 0, end = opts?.end ?? g.nodes.length - 1;
    const f: Frame[] = [];
    const visited: number[] = [];
    const parent: Record<number, number> = {};
    const v: Record<string, number | string> = { start, end };
    const push = (line: number, current: number | null, edge: [number, number] | null = null, ev: Frame["event"] = null, pathEdges?: [number, number][]) => {
      v.visited = visited.length;
      f.push({
        arr: [], highlight: [], swap: [], sorted: [], pivot: null,
        line, vars: { ...v }, event: ev,
        graph: { ...g, visited: [...visited], current, activeEdge: edge, start, end, pathEdges },
      });
    };
    let stop = false;
    const go = (u: number) => {
      if (stop) return;
      visited.push(u);
      push(1, u, null, "visit");
      if (u === end) { stop = true; return; }
      for (const { to } of adj[u]) {
        if (stop) return;
        push(2, u, [u, to], "compare");
        if (!visited.includes(to)) { parent[to] = u; go(to); }
      }
    };
    go(start);
    const path: number[] = [];
    if (visited.includes(end)) {
      let cur: number | undefined = end;
      while (cur !== undefined) { path.unshift(cur); if (cur === start) break; cur = parent[cur]; }
    }
    const pathEdges: [number, number][] = [];
    for (let i = 0; i < path.length - 1; i++) pathEdges.push([path[i], path[i + 1]]);
    const lbl = (id: number) => g.nodes[id]?.label ?? String(id);
    const pathStr = path.map(lbl).join(" → ");
    v.path = pathStr || "none";
    v.task = `DFS: find any path ${lbl(start)} → ${lbl(end)}`;
    v.label = path.length
      ? `DFS path ${lbl(start)}→${lbl(end)}: ${pathStr} • ${path.length - 1} edges`
      : `DFS: no path from ${lbl(start)} to ${lbl(end)}`;
    push(0, null, null, "found", pathEdges);
    return f;
  },
};

const dijkstra: AlgoDef = {
  id: "dijkstra",
  name: "Dijkstra",
  category: "graph",
  code: `dist[start] = 0;
while (pq.size) {
  const u = pq.extractMin();
  for (const {to, w} of adj[u]) {
    if (dist[u] + w < dist[to]) {
      dist[to] = dist[u] + w;
    }
  }
}`,
  run(_arr, opts) {
    const g = opts?.graph ?? makeSampleGraph();
    const adj = adjacency(g, true);
    const start = opts?.start ?? 0, end = opts?.end ?? g.nodes.length - 1;
    const f: Frame[] = [];
    const dist: Record<number, number | string> = {};
    const parent: Record<number, number> = {};
    g.nodes.forEach((n) => (dist[n.id] = Infinity));
    dist[start] = 0;
    const visited: number[] = [];
    const v: Record<string, number | string> = { start, end };
    const push = (line: number, current: number | null, edge: [number, number] | null = null, ev: Frame["event"] = null, pathEdges?: [number, number][]) => {
      const ddisp: Record<number, number | string> = {};
      Object.entries(dist).forEach(([k, val]) => (ddisp[+k] = val === Infinity ? "∞" : val));
      f.push({
        arr: [], highlight: [], swap: [], sorted: [], pivot: null,
        line, vars: { ...v }, event: ev,
        graph: { ...g, visited: [...visited], current, activeEdge: edge, dist: ddisp, start, end, pathEdges },
      });
    };
    push(0, start);
    while (visited.length < g.nodes.length) {
      let u = -1;
      let best = Infinity;
      for (const n of g.nodes) {
        if (!visited.includes(n.id) && (dist[n.id] as number) < best) {
          best = dist[n.id] as number;
          u = n.id;
        }
      }
      if (u === -1) break;
      visited.push(u);
      v.u = u;
      push(2, u, null, "visit");
      for (const { to, w } of adj[u]) {
        push(4, u, [u, to], "compare");
        if ((dist[u] as number) + w < (dist[to] as number)) {
          dist[to] = (dist[u] as number) + w;
          parent[to] = u;
          push(5, u, [u, to], "swap");
        }
      }
    }
    // reconstruct shortest path start -> end
    const path: number[] = [];
    if (dist[end] !== Infinity) {
      let cur: number | undefined = end;
      while (cur !== undefined) { path.unshift(cur); if (cur === start) break; cur = parent[cur]; }
    }
    const pathEdges: [number, number][] = [];
    for (let i = 0; i < path.length - 1; i++) pathEdges.push([path[i], path[i + 1]]);
    const lbl = (id: number) => g.nodes[id]?.label ?? String(id);
    const pathStr = path.map(lbl).join(" → ");
    v.path = pathStr || "none";
    v.cost = dist[end] === Infinity ? "∞" : dist[end];
    v.task = `Dijkstra: shortest weighted path ${lbl(start)} → ${lbl(end)}`;
    v.label = path.length
      ? `SHORTEST path ${lbl(start)}→${lbl(end)}: ${pathStr} • total cost = ${dist[end]}`
      : `Dijkstra: ${lbl(end)} is unreachable from ${lbl(start)}`;
    push(0, null, null, "found", pathEdges);
    return f;
  },
};

/* ---------------- CUSTOM ---------------- */

const customAlgo: AlgoDef = {
  id: "custom",
  name: "Custom Code",
  category: "custom",
  code: `// Custom bubble sort
// API: vis.compare(i,j), vis.swap(i,j), vis.mark(...idx),
//      vis.markSorted(i), vis.set(i,v), vis.label(text),
//      vis.snapshot()
// Available: arr, n, vis
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    vis.compare(j, j + 1);
    if (arr[j] > arr[j + 1]) vis.swap(j, j + 1);
  }
  vis.markSorted(n - i - 1);
}`,
  run(arr, opts) {
    const a = [...arr];
    const f: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {};
    let line = 0;
    let label = "";
    const push = (ev: Frame["event"] = null, hi: number[] = [], sw: number[] = []) => {
      f.push(snap(a, line, v, sorted, hi, sw, null, { event: ev, label }));
    };
    const vis = {
      compare: (i: number, j: number) => { line = 0; push("compare", [i, j]); },
      swap: (i: number, j: number) => {
        [a[i], a[j]] = [a[j], a[i]];
        line = 0; push("swap", [], [i, j]);
      },
      mark: (...idx: number[]) => { push(null, idx); },
      markSorted: (i: number) => { sorted.add(i); push(); },
      set: (i: number, val: number) => { a[i] = val; push("swap", [i]); },
      label: (text: string) => { label = text; v.label = text; push(); },
      snapshot: () => push(),
    };
    try {
      const code = opts?.customCode ?? customAlgo.code;
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const fn = new Function("arr", "n", "vis", code);
      fn(a, a.length, vis);
    } catch (e) {
      console.error("Custom code error:", e);
      v.error = (e as Error).message;
      push();
    }
    push();
    return f;
  },
};

/**
 * Parse a graph description like:
 *   "A-B:4, A-D:2, B-C:3, B-E:5"
 * Nodes are auto-discovered. Returns a GraphState laid out in a circle.
 */
export function parseGraph(text: string): GraphState | null {
  const t = text.trim();
  if (!t) return null;
  const parts = t.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
  const labelToId = new Map<string, number>();
  const labels: string[] = [];
  const edges: GraphEdge[] = [];
  const ensure = (lbl: string) => {
    if (!labelToId.has(lbl)) { labelToId.set(lbl, labels.length); labels.push(lbl); }
    return labelToId.get(lbl)!;
  };
  for (const p of parts) {
    const m = p.match(/^([A-Za-z0-9_]+)\s*[-–>]\s*([A-Za-z0-9_]+)(?:\s*[:=]\s*(-?\d+(?:\.\d+)?))?$/);
    if (!m) continue;
    const a = ensure(m[1]);
    const b = ensure(m[2]);
    const w = m[3] != null ? parseFloat(m[3]) : undefined;
    edges.push({ a, b, w });
  }
  if (!labels.length) return null;
  // circular layout
  const N = labels.length;
  const cx = 0.5, cy = 0.5, rx = 0.38, ry = 0.36;
  const nodes: GraphNode[] = labels.map((lbl, i) => {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { id: i, label: lbl, x: cx + rx * Math.cos(ang), y: cy + ry * Math.sin(ang) };
  });
  return { nodes, edges };
}

export const ALGORITHMS: Record<string, AlgoDef> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  quick: quickSort,
  merge: mergeSort,
  heap: heapSort,
  linear: linearSearch,
  binary: binarySearch,
  bfs,
  dfs,
  dijkstra,
  custom: customAlgo,
};

export const ALGO_GROUPS: { label: { en: string; vi: string }; ids: string[] }[] = [
  { label: { en: "Sorting", vi: "Sắp xếp" }, ids: ["bubble", "selection", "insertion", "quick", "merge", "heap"] },
  { label: { en: "Searching", vi: "Tìm kiếm" }, ids: ["linear", "binary"] },
  { label: { en: "Graph", vi: "Đồ thị" }, ids: ["bfs", "dfs", "dijkstra"] },
  { label: { en: "Custom", vi: "Custom" }, ids: ["custom"] },
];
