import type { AlgoDef, Frame } from "../types";
import { adjacency, makeSampleGraph } from "./utils";

export const dijkstra: AlgoDef = {
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
