import type { Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawGraph(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  top: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang = "en",
) {
  const g = frame.graph!;
  const hasMatrix = g.nodes.length > 1;
  const showSideMatrix = hasMatrix && w >= 620 && h >= 360;
  const taskText = String(frame.vars.task ?? "");
  const taskH = taskText ? 48 : 0;
  const resultH = g.pathEdges?.length ? Math.min(86, h * 0.16) : 0;
  const gap = Math.max(18, Math.round(w * 0.035));
  const matrixW = showSideMatrix ? Math.min(w * 0.56, Math.max(360, w * 0.48)) : 0;
  const graphW = showSideMatrix ? w - matrixW - gap : w;
  const contentTop = top + taskH;
  const contentH = Math.max(120, h - taskH - resultH);
  const graphBox = { x: padding, y: contentTop + 8, w: graphW, h: contentH - 16 };
  const matrixBox = {
    x: padding + graphW + gap,
    y: contentTop + 8,
    w: matrixW,
    h: contentH - 16,
  };
  const px = (n: { x: number; y: number }) => ({ x: graphBox.x + n.x * graphBox.w, y: graphBox.y + n.y * graphBox.h });
  const isPathEdge = (a: number, b: number) =>
    !!g.pathEdges?.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  if (taskText) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "600 22px ui-sans-serif, system-ui";
    const tw = ctx.measureText(taskText).width + 28;
    const bx = padding + w / 2 - tw / 2;
    const by = top + 4;
    ctx.fillStyle = "rgba(34, 211, 238, 0.18)";
    ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, tw, 36, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#a5f3fc";
    ctx.textBaseline = "middle";
    ctx.fillText(taskText, padding + w / 2, by + 18);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }

  if (showSideMatrix) {
    drawAdjacencyMatrix(ctx, frame, matrixBox.x, matrixBox.y, matrixBox.w, matrixBox.h, theme, lang);
  }

  ctx.lineWidth = 3;
  for (const e of g.edges) {
    const a = px(g.nodes[e.a]);
    const b = px(g.nodes[e.b]);
    const active = g.activeEdge && ((g.activeEdge[0] === e.a && g.activeEdge[1] === e.b) || (g.activeEdge[0] === e.b && g.activeEdge[1] === e.a));
    const onPath = isPathEdge(e.a, e.b);
    if (onPath) {
      ctx.save();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 9;
      ctx.shadowColor = "#fde047";
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = active ? theme.highlight : "rgba(148,163,184,0.5)";
      ctx.lineWidth = active ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (typeof e.w === "number") {
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len, ny = dx / len;
      const mx = (a.x + b.x) / 2 + nx * 14;
      const my = (a.y + b.y) / 2 + ny * 14;
      const label = String(e.w);
      ctx.font = "bold 20px ui-monospace, monospace";
      const tw = ctx.measureText(label).width;
      const pillW = tw + 22, pillH = 28;
      ctx.save();
      ctx.fillStyle = onPath ? "#fde047" : "#0f172a";
      ctx.strokeStyle = onPath ? "#0f172a" : "#fbbf24";
      ctx.lineWidth = 2;
      roundRect(ctx, mx - pillW / 2, my - pillH / 2, pillW, pillH, 14);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = onPath ? "#0f172a" : "#fde047";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my + 1);
      ctx.restore();
    }
  }

  for (const n of g.nodes) {
    const p = px(n);
    const visited = g.visited?.includes(n.id);
    const current = g.current === n.id;
    const isStart = g.start === n.id;
    const isEnd = g.end === n.id;
    let color = theme.bar;
    if (visited) color = theme.sorted;
    if (current) color = theme.highlight;
    if (isStart) color = "#22d3ee";
    if (isEnd) color = "#f43f5e";

    if (isStart || isEnd) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(p.x, p.y, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(15,23,42,0.6)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px ui-sans-serif, system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(n.label ?? String(n.id), p.x, p.y);
    if (g.dist && g.dist[n.id] !== undefined) {
      ctx.fillStyle = theme.highlight;
      ctx.font = "600 18px ui-monospace, monospace";
      ctx.fillText(String(g.dist[n.id]), p.x, p.y - 44);
    }
    if (isStart || isEnd) {
      ctx.fillStyle = color;
      ctx.font = "bold 14px ui-sans-serif, system-ui";
      ctx.fillText(isStart ? label(lang, "BẮT ĐẦU", "START") : label(lang, "KẾT THÚC", "END"), p.x, p.y + 50);
    }
  }
  ctx.textBaseline = "alphabetic";

  if (g.pathEdges && g.pathEdges.length) {
    drawResultBanner(ctx, frame, padding, top, w, h);
  }
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}

function drawAdjacencyMatrix(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang,
) {
  const g = frame.graph!;
  const n = g.nodes.length;
  const weighted = (Boolean(g.dist) || Number(frame.vars.matrixWeighted ?? 0) === 1) && g.edges.some((edge) => typeof edge.w === "number");
  const matrix = makeMatrix(g.nodes.map((node) => node.id), g.edges, weighted, matrixBuildCount(frame));
  const title = label(lang, "MA TRẬN KỀ", "ADJACENCY MATRIX");
  const subtitle = weighted
    ? label(lang, "Ô [i][j] là trọng số cạnh, 0 nghĩa là không có cạnh.", "Cell [i][j] is edge weight; 0 means no edge.")
    : label(lang, "Ô [i][j] = 1 nghĩa là có cạnh giữa node i và node j.", "Cell [i][j] = 1 means there is an edge between nodes i and j.");
  const titleSize = Math.max(20, Math.min(34, w / 15));
  const bodySize = Math.max(12, Math.min(18, w / 32));
  const labelW = Math.max(38, Math.min(58, w * 0.12));
  const titleH = titleSize + bodySize * 2.7 + 26;
  const cell = Math.floor(Math.min((w - labelW - 8) / n, (h - titleH - labelW) / n));
  if (cell < 13) return;
  const gridW = cell * n;
  const gridH = cell * n;
  const gridX = x + labelW + Math.max(0, (w - labelW - gridW) / 2);
  const gridY = y + titleH + labelW * 0.55;
  const active = g.activeEdge;
  const current = g.current;

  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.38)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.16)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${titleSize}px ui-sans-serif, system-ui`;
  const grad = ctx.createLinearGradient(x + w * 0.2, y, x + w * 0.8, y);
  grad.addColorStop(0, "#22d3ee");
  grad.addColorStop(1, "#bef264");
  ctx.fillStyle = grad;
  ctx.fillText(title, x + w / 2, y + titleSize * 0.85);

  ctx.font = `600 ${bodySize}px ui-monospace, monospace`;
  ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
  wrapText(ctx, subtitle, w - 36).slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, x + w / 2, y + titleSize + 22 + index * (bodySize + 5));
  });

  drawMatrixStats(ctx, x, y + titleH - 34, w, bodySize, weighted, lang);

  ctx.font = `700 ${Math.min(18, cell * 0.45)}px ui-monospace, monospace`;
  const labels = g.nodes.map((node) => node.label ?? String(node.id));
  labels.forEach((nodeLabel, index) => {
    const cx = gridX + index * cell + cell / 2;
    const cy = gridY + index * cell + cell / 2;
    const isActiveNode = current === g.nodes[index].id || active?.includes(g.nodes[index].id);
    ctx.fillStyle = isActiveNode ? theme.highlight : "rgba(147, 197, 253, 0.86)";
    ctx.fillText(nodeLabel, cx, gridY - cell * 0.55);
    ctx.fillText(nodeLabel, gridX - labelW * 0.52, cy);
  });

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const value = matrix[row][col];
      const cx = gridX + col * cell;
      const cy = gridY + row * cell;
      const nodeA = g.nodes[row].id;
      const nodeB = g.nodes[col].id;
      const isActiveCell = Boolean(active && active[0] === nodeA && active[1] === nodeB);
      const isMirrorCell = Boolean(active && active[0] === nodeB && active[1] === nodeA);
      const isPathCell = Boolean(g.pathEdges?.some(([a, b]) => (a === nodeA && b === nodeB) || (a === nodeB && b === nodeA)));
      ctx.fillStyle = value
        ? isPathCell ? "rgba(253, 224, 71, 0.28)" : "rgba(16, 185, 129, 0.22)"
        : "rgba(30, 41, 59, 0.5)";
      ctx.fillRect(cx, cy, cell - 1, cell - 1);
      if (isActiveCell || isMirrorCell) {
        ctx.strokeStyle = isActiveCell ? "#fb7185" : "rgba(251, 113, 133, 0.55)";
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.strokeRect(cx + 2, cy + 2, cell - 5, cell - 5);
      }
      ctx.fillStyle = value ? "#bbf7d0" : "rgba(226, 232, 240, 0.56)";
      ctx.fillText(String(value), cx + cell / 2, cy + cell / 2 + 1);
    }
  }

  const cellText = active
    ? `Cell [${nodeLabel(g, active[0])}][${nodeLabel(g, active[1])}] = ${matrixValue(g, matrix, active[0], active[1])}`
    : label(lang, "Ma trận kề cho biết node nào nối với node nào.", "Adjacency matrix shows which nodes are connected.");
  ctx.font = `700 ${Math.max(13, Math.min(18, cell * 0.38))}px ui-monospace, monospace`;
  ctx.fillStyle = "#dbeafe";
  ctx.shadowColor = "#2563eb";
  ctx.shadowBlur = 12;
  ctx.fillText(cellText, x + w / 2, Math.min(y + h - 24, gridY + gridH + 34));
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawMatrixStats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  fontSize: number,
  weighted: boolean,
  lang: Lang,
) {
  const items = [
    ["SPACE", "O(V²)"],
    [label(lang, "TRA CỨU CẠNH", "EDGE LOOKUP"), "O(1)"],
    [label(lang, "DUYỆT HÀNG XÓM", "FIND NEIGHBORS"), weighted ? "O(V)" : "O(V)"],
  ];
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  items.forEach(([top, bottom], index) => {
    const cx = x + (w * (index + 0.5)) / items.length;
    ctx.fillStyle = "rgba(148, 163, 184, 0.64)";
    ctx.font = `800 ${Math.max(8, fontSize * 0.55)}px ui-monospace, monospace`;
    ctx.fillText(top, cx, y);
    ctx.fillStyle = index === 1 ? "#5eead4" : "rgba(226, 232, 240, 0.84)";
    ctx.font = `800 ${fontSize}px ui-monospace, monospace`;
    ctx.fillText(bottom, cx, y + fontSize + 7);
  });
  ctx.restore();
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

function matrixValue(g: NonNullable<Frame["graph"]>, matrix: number[][], a: number, b: number) {
  const row = g.nodes.findIndex((node) => node.id === a);
  const col = g.nodes.findIndex((node) => node.id === b);
  return row >= 0 && col >= 0 ? matrix[row][col] : 0;
}

function nodeLabel(g: NonNullable<Frame["graph"]>, id: number) {
  return g.nodes.find((node) => node.id === id)?.label ?? String(id);
}

function drawResultBanner(ctx: CanvasRenderingContext2D, frame: Frame, padding: number, top: number, w: number, h: number) {
  const text = String(frame.vars.label ?? "");
  if (!text) return;
  ctx.save();
  ctx.textAlign = "center";
  const fontSize = Math.max(18, Math.min(30, Math.floor(w / Math.max(28, text.length * 0.55))));
  ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui`;
  const lines = wrapText(ctx, text, w - 60);
  const lineH = fontSize + 6;
  const boxH = lines.length * lineH + 16;
  const tw = Math.min(w - 20, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 40);
  const bx = padding + w / 2 - tw / 2;
  const by = top + h - boxH - 8;
  ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, tw, boxH, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "middle";
  lines.forEach((ln, i) => {
    ctx.fillText(ln, padding + w / 2, by + 8 + i * lineH + lineH / 2);
  });
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (ctx.measureText(trial).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
