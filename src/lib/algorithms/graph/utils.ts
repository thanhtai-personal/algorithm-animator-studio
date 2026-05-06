import type { GraphEdge, GraphNode, GraphState } from "../types";

export function makeSampleGraph(): GraphState {
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

export function adjacency(g: GraphState, weighted = false) {
  const adj: Record<number, { to: number; w: number }[]> = {};
  g.nodes.forEach((n) => (adj[n.id] = []));
  g.edges.forEach((e) => {
    adj[e.a].push({ to: e.b, w: weighted ? e.w ?? 1 : 1 });
    adj[e.b].push({ to: e.a, w: weighted ? e.w ?? 1 : 1 });
  });
  return adj;
}

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
  const n = labels.length;
  const cx = 0.5, cy = 0.5, rx = 0.38, ry = 0.36;
  const nodes: GraphNode[] = labels.map((lbl, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { id: i, label: lbl, x: cx + rx * Math.cos(ang), y: cy + ry * Math.sin(ang) };
  });
  return { nodes, edges };
}
