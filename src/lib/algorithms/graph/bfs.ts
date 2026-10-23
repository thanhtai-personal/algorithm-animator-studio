import type { AlgoDef, Frame } from "../types";
import { adjacency, createAdjacencyMatrixIntroFrames, makeSampleGraph } from "./utils";

export const bfs: AlgoDef = {
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
    const f: Frame[] = createAdjacencyMatrixIntroFrames({ graph: g, start, end, label: "BFS" });
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
