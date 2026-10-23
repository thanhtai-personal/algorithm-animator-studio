import type { AlgoDef, Frame } from "../types";
import { adjacency, createAdjacencyMatrixIntroFrames, makeSampleGraph } from "./utils";

export const dfs: AlgoDef = {
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
    const f: Frame[] = createAdjacencyMatrixIntroFrames({ graph: g, start, end, label: "DFS" });
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
