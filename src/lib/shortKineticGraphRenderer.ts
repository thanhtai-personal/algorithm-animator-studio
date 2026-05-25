import type { Frame, GraphState } from "./algorithms";
import { withTextShadow } from "./canvasText";
import type { Lang } from "./i18n";
import { roundRect } from "./renderers/shapes";
import type { ShortKineticParams } from "./shortKineticTypographyRenderer";

type GraphBeat = {
  kicker: string;
  main: string;
  sub: string;
  accent: string;
  mode: "build" | "intro" | "visit" | "edge" | "update" | "done";
};

export function renderShortKineticGraph(ctx: CanvasRenderingContext2D, params: ShortKineticParams, w: number, h: number) {
  if (!params.frame.graph) return;
  const beat = getGraphBeat(params);
  drawGraphBackground(ctx, w, h, params.frameIndex / Math.max(1, params.frameCount - 1), beat.accent);
  drawGraphMeta(ctx, params, w);
  drawGraphBeat(ctx, beat, params.transitionProgress, w, h);
  drawMatrix(ctx, params.frame, beat, w, h, params.lang, params.algorithmId === "dijkstra");
  drawMiniGraph(ctx, params.frame, beat, w, h);
  drawProgress(ctx, params, beat.accent, w, h);
}

function getGraphBeat(params: ShortKineticParams): GraphBeat {
  const vi = params.lang === "vi";
  const frame = params.frame;
  const g = frame.graph;
  const active = g?.activeEdge;
  const weighted = params.algorithmId === "dijkstra";
  const from = active ? nodeLabel(g, active[0]) : nodeLabel(g, g?.current ?? 0);
  const to = active ? nodeLabel(g, active[1]) : "";
  const edgeValue = active ? matrixValue(g, active[0], active[1], weighted) : 0;
  const building = frame.vars.matrixBuildCount !== undefined;

  if (building) return {
    kicker: vi ? "DỰNG MA TRẬN" : "BUILD MATRIX",
    main: active ? `${from} ↔ ${to}` : (vi ? "BẮT ĐẦU TỪ 0" : "START WITH 0s"),
    sub: active
      ? weighted ? `${from}${to} = ${edgeValue}` : (vi ? `Điền 1 vào hai ô đối xứng` : "Fill both symmetric cells with 1")
      : (vi ? "Mỗi cạnh sẽ điền một cặp ô" : "Each edge fills a pair of cells"),
    accent: "#22d3ee",
    mode: "build",
  };

  if (params.frameIndex === 0) return {
    kicker: params.algoName.toUpperCase(),
    main: vi ? "ĐỌC MA TRẬN KỀ" : "READ THE MATRIX",
    sub: weighted ? (vi ? "Dijkstra dùng trọng số cạnh" : "Dijkstra reads edge weights") : (vi ? "1 là có cạnh, 0 là không" : "1 means edge, 0 means none"),
    accent: "#38bdf8",
    mode: "intro",
  };
  if (params.frameIndex >= params.frameCount - 2 || g?.pathEdges?.length) return {
    kicker: vi ? "KẾT QUẢ" : "RESULT",
    main: weighted ? (vi ? "ĐƯỜNG RẺ NHẤT" : "LOWEST COST PATH") : (vi ? "ĐƯỜNG ĐÃ TÌM" : "PATH FOUND"),
    sub: String(frame.vars.path ?? (vi ? "Theo các ô sáng trong ma trận" : "Follow the highlighted matrix cells")),
    accent: "#4ade80",
    mode: "done",
  };
  if (frame.event === "swap") return {
    kicker: weighted ? (vi ? "RELAX CẠNH" : "RELAX EDGE") : (vi ? "THÊM NODE" : "ADD NODE"),
    main: active ? `${from} → ${to}` : (vi ? "CẬP NHẬT" : "UPDATE"),
    sub: weighted ? `${from} + ${edgeValue} ${vi ? "tạo cost tốt hơn" : "gives a better cost"}` : (vi ? "Đánh dấu đã thăm" : "Mark as visited"),
    accent: "#facc15",
    mode: "update",
  };
  if (frame.event === "compare" && active) return {
    kicker: vi ? "KIỂM TRA Ô" : "CHECK CELL",
    main: `[${from}][${to}] = ${edgeValue}`,
    sub: edgeValue ? (weighted ? (vi ? "Có cạnh, xét cost" : "Edge exists, test cost") : (vi ? "Có cạnh, xét hàng xóm" : "Edge exists, inspect neighbor")) : (vi ? "Không có cạnh" : "No edge"),
    accent: edgeValue ? "#22d3ee" : "#94a3b8",
    mode: "edge",
  };
  return {
    kicker: vi ? "VISIT NODE" : "VISIT NODE",
    main: nodeLabel(g, g?.current ?? Number(frame.vars.u ?? 0)),
    sub: weighted ? (vi ? "Chọn dist nhỏ nhất chưa xử lý" : "Pick the smallest unsettled dist") : (vi ? "Lấy node tiếp theo từ frontier" : "Take the next frontier node"),
    accent: weighted ? "#facc15" : params.algorithmId === "dfs" ? "#fb7185" : "#38bdf8",
    mode: "visit",
  };
}

function drawGraphBackground(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, accent: string) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#020617");
  bg.addColorStop(0.55, "#030712");
  bg.addColorStop(1, "#020617");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 18; i++) {
    const x = ((i * 97 + progress * 180) % (w + 160)) - 80;
    const y = 170 + i * (h - 360) / 18;
    ctx.strokeStyle = `${accent}${i % 3 === 0 ? "55" : "28"}`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 120, y + 52);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGraphMeta(ctx: CanvasRenderingContext2D, params: ShortKineticParams, w: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = "850 32px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 32, () => ctx.fillText(params.title || params.algoName, w / 2, 70));
  ctx.fillStyle = "rgba(255,255,255,0.56)";
  ctx.font = "650 21px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 21, () => ctx.fillText(params.lang === "vi" ? "Kinetic graph short với ma trận kề" : "Kinetic graph short with adjacency matrix", w / 2, 104));
}

function drawGraphBeat(ctx: CanvasRenderingContext2D, beat: GraphBeat, local: number, w: number, h: number) {
  const enter = easeOutBack(Math.min(1, local * 1.3));
  ctx.save();
  ctx.translate(w / 2, h * 0.22 + (1 - enter) * 72);
  ctx.scale(0.82 + enter * 0.18, 0.82 + enter * 0.18);
  ctx.textAlign = "center";
  ctx.fillStyle = beat.accent;
  ctx.font = "950 38px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 38, () => ctx.fillText(beat.kicker, 0, -58));
  ctx.fillStyle = "#ffffff";
  drawFitted(ctx, beat.main, 0, 18, 84, w - 92, 950);
  ctx.fillStyle = beat.accent;
  drawFitted(ctx, beat.sub, 0, 88, 34, w - 118, 850);
  ctx.restore();
}

function drawMatrix(ctx: CanvasRenderingContext2D, frame: Frame, beat: GraphBeat, w: number, h: number, lang: Lang, algorithmWeighted: boolean) {
  const g = frame.graph!;
  const weighted = algorithmWeighted || Number(frame.vars.matrixWeighted ?? 0) === 1 || Boolean(g.dist);
  const ids = g.nodes.map((node) => node.id);
  const visibleEdgeCount = matrixBuildCount(frame);
  const matrix = makeMatrix(ids, g.edges, weighted, visibleEdgeCount);
  const n = g.nodes.length;
  const boxW = w - 112;
  const boxH = Math.min(650, h * 0.38);
  const x = 56;
  const y = h * 0.39;
  const labelW = 58;
  const cell = Math.floor(Math.min((boxW - labelW - 20) / n, (boxH - 118) / n));
  const gridW = cell * n;
  const gridX = x + labelW + (boxW - labelW - gridW) / 2;
  const gridY = y + 104;
  const active = g.activeEdge;
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.72)";
  ctx.strokeStyle = `${beat.accent}66`;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, boxW, boxH, 28); ctx.fill(); ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const title = lang === "vi" ? "MA TRẬN KỀ" : "ADJACENCY MATRIX";
  ctx.font = "950 34px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = beat.accent;
  withTextShadow(ctx, 34, () => ctx.fillText(title, w / 2, y + 34));
  ctx.font = "700 20px ui-monospace, monospace";
  ctx.fillStyle = "rgba(226,232,240,0.7)";
  ctx.fillText(weighted ? "weight[u][v]" : "adj[u][v] = 0 / 1", w / 2, y + 70);

  ctx.font = `900 ${Math.min(28, cell * 0.42)}px ui-monospace, monospace`;
  g.nodes.forEach((node, index) => {
    const label = node.label ?? String(node.id);
    const activeNode = node.id === g.current || active?.includes(node.id);
    ctx.fillStyle = activeNode ? beat.accent : "#93c5fd";
    ctx.fillText(label, gridX + index * cell + cell / 2, gridY - cell * 0.45);
    ctx.fillText(label, gridX - labelW * 0.45, gridY + index * cell + cell / 2);
  });

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const value = matrix[row][col];
      const nodeA = g.nodes[row].id;
      const nodeB = g.nodes[col].id;
      const activeCell = Boolean(active && active[0] === nodeA && active[1] === nodeB);
      const mirrorCell = Boolean(active && active[0] === nodeB && active[1] === nodeA);
      const pathCell = Boolean(g.pathEdges?.some(([a, b]) => (a === nodeA && b === nodeB) || (a === nodeB && b === nodeA)));
      const cx = gridX + col * cell;
      const cy = gridY + row * cell;
      ctx.fillStyle = pathCell ? "rgba(74,222,128,0.34)" : value ? "rgba(34,211,238,0.2)" : "rgba(15,23,42,0.82)";
      ctx.fillRect(cx, cy, cell - 2, cell - 2);
      if (activeCell || mirrorCell) {
        ctx.strokeStyle = activeCell ? "#fb7185" : "rgba(251,113,133,0.45)";
        ctx.lineWidth = Math.max(4, cell * 0.08);
        ctx.strokeRect(cx + 4, cy + 4, cell - 10, cell - 10);
      }
      ctx.fillStyle = value ? "#ffffff" : "rgba(148,163,184,0.62)";
      ctx.font = `950 ${Math.min(36, cell * 0.52)}px ui-monospace, monospace`;
      ctx.fillText(String(value), cx + cell / 2, cy + cell / 2 + 1);
    }
  }

  const readout = frame.vars.matrixBuildCount !== undefined
    ? active
      ? `Fill [${nodeLabel(g, active[0])}][${nodeLabel(g, active[1])}] and [${nodeLabel(g, active[1])}][${nodeLabel(g, active[0])}]`
      : lang === "vi" ? "Khởi tạo toàn bộ ô bằng 0" : "Initialize every cell to 0"
    : active
    ? `Cell [${nodeLabel(g, active[0])}][${nodeLabel(g, active[1])}] = ${matrixValue(g, active[0], active[1], weighted)}`
    : weighted ? "O(1) edge lookup, O(V) neighbor scan" : "1 = edge, 0 = no edge";
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "900 24px ui-monospace, monospace";
  withTextShadow(ctx, 24, () => ctx.fillText(readout, w / 2, y + boxH - 34));
  ctx.restore();
}

function drawMiniGraph(ctx: CanvasRenderingContext2D, frame: Frame, beat: GraphBeat, w: number, h: number) {
  const g = frame.graph!;
  const visibleEdgeCount = matrixBuildCount(frame);
  const x = 70;
  const y = h * 0.78;
  const boxW = w - 140;
  const boxH = h * 0.14;
  const px = (node: { x: number; y: number }) => ({ x: x + node.x * boxW, y: y + node.y * boxH });
  ctx.save();
  ctx.lineWidth = 4;
  for (const [index, edge] of g.edges.entries()) {
    if (visibleEdgeCount !== null && index >= visibleEdgeCount) continue;
    const a = px(g.nodes[edge.a]);
    const b = px(g.nodes[edge.b]);
    const active = g.activeEdge && ((g.activeEdge[0] === edge.a && g.activeEdge[1] === edge.b) || (g.activeEdge[0] === edge.b && g.activeEdge[1] === edge.a));
    const path = g.pathEdges?.some(([u, v]) => (u === edge.a && v === edge.b) || (u === edge.b && v === edge.a));
    ctx.strokeStyle = path ? "#4ade80" : active ? beat.accent : "rgba(148,163,184,0.34)";
    ctx.lineWidth = path ? 8 : active ? 6 : 3;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (const node of g.nodes) {
    const p = px(node);
    const active = node.id === g.current || g.activeEdge?.includes(node.id);
    const visited = g.visited?.includes(node.id);
    ctx.fillStyle = active ? beat.accent : visited ? "#4ade80" : "#1e293b";
    ctx.beginPath(); ctx.arc(p.x, p.y, active ? 29 : 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 22px ui-sans-serif, system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(node.label ?? String(node.id), p.x, p.y + 1);
    if (g.dist?.[node.id] !== undefined) {
      ctx.fillStyle = "#fef08a";
      ctx.font = "800 17px ui-monospace, monospace";
      ctx.fillText(String(g.dist[node.id]), p.x, p.y - 38);
    }
  }
  ctx.restore();
}

function drawProgress(ctx: CanvasRenderingContext2D, params: ShortKineticParams, accent: string, w: number, h: number) {
  const p = params.frameIndex / Math.max(1, params.frameCount - 1);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, 50, h - 64, w - 100, 10, 5); ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, 50, h - 64, (w - 100) * p, 10, 5); ctx.fill();
}

function makeMatrix(nodeIds: number[], edges: { a: number; b: number; w?: number }[], weighted: boolean, visibleEdgeCount: number | null) {
  const indexById = new Map(nodeIds.map((id, index) => [id, index]));
  const matrix = Array.from({ length: nodeIds.length }, () => Array.from({ length: nodeIds.length }, () => 0));
  const visibleEdges = visibleEdgeCount === null ? edges : edges.slice(0, visibleEdgeCount);
  for (const edge of visibleEdges) {
    const a = indexById.get(edge.a);
    const b = indexById.get(edge.b);
    if (a === undefined || b === undefined) continue;
    const value = weighted ? edge.w ?? 1 : 1;
    matrix[a][b] = value;
    matrix[b][a] = value;
  }
  return matrix;
}

function matrixBuildCount(frame: Frame) {
  return frame.vars.matrixBuildCount === undefined ? null : Number(frame.vars.matrixBuildCount);
}

function matrixValue(g: GraphState | undefined, a: number, b: number, weighted: boolean) {
  if (!g) return 0;
  const edge = g.edges.find((item) => (item.a === a && item.b === b) || (item.a === b && item.b === a));
  return edge ? weighted ? edge.w ?? 1 : 1 : 0;
}

function nodeLabel(g: GraphState | undefined, id: number) {
  return g?.nodes.find((node) => node.id === id)?.label ?? String(id);
}

function drawFitted(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, weight: number) {
  let fitted = size;
  while (fitted > 24) {
    ctx.font = `${weight} ${fitted}px ui-sans-serif, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fitted -= 3;
  }
  withTextShadow(ctx, fitted, () => ctx.fillText(text, x, y));
}

function easeOutBack(value: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  const safe = Math.max(0, Math.min(1, value));
  return 1 + c3 * Math.pow(safe - 1, 3) + c1 * Math.pow(safe - 1, 2);
}
