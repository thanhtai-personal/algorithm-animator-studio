import type { Frame, GraphEdge, GraphNode, GraphState } from "../types";

export function makeSampleGraph(): GraphState {
  const nodes: GraphNode[] = [
    { id: 0, x: 0.15, y: 0.24, label: "A" },
    { id: 1, x: 0.5, y: 0.1, label: "B" },
    { id: 2, x: 0.85, y: 0.24, label: "C" },
    { id: 3, x: 0.25, y: 0.7, label: "D" },
    { id: 4, x: 0.58, y: 0.5, label: "E" },
    { id: 5, x: 0.82, y: 0.82, label: "F" },
  ];
  const edges: GraphEdge[] = [
    { a: 0, b: 1, w: 9 },
    { a: 0, b: 3, w: 2 },
    { a: 1, b: 2, w: 3 },
    { a: 1, b: 4, w: 4 },
    { a: 2, b: 5, w: 6 },
    { a: 3, b: 4, w: 1 },
    { a: 3, b: 5, w: 12 },
    { a: 4, b: 2, w: 5 },
    { a: 4, b: 5, w: 3 },
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

export function createAdjacencyMatrixIntroFrames(params: {
  graph: GraphState;
  start: number;
  end: number;
  weighted?: boolean;
  label: string;
}) {
  const frames: Frame[] = [];
  const { graph: g, start, end, weighted = false, label: algoLabel } = params;
  const push = (edgeIndex: number, activeEdge: [number, number] | null) => {
    const edge = activeEdge ? g.edges[edgeIndex - 1] : null;
    const value = edge ? weighted ? edge.w ?? 1 : 1 : 0;
    frames.push({
      arr: [], highlight: [], swap: [], sorted: [], pivot: null,
      line: 0,
      event: activeEdge ? "compare" : null,
      vars: {
        task: `${algoLabel}: build adjacency matrix first`,
        matrixBuildCount: edgeIndex,
        matrixBuildTotal: g.edges.length,
        matrixWeighted: weighted ? 1 : 0,
        matrixValue: value,
      },
      graph: { ...g, current: null, activeEdge, start, end },
    });
  };
  push(0, null);
  g.edges.forEach((edge, index) => push(index + 1, [edge.a, edge.b]));
  return frames;
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
