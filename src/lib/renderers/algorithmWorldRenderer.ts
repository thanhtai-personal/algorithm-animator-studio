import type { AlgorithmWorldCell, AlgorithmWorldCompareState, AlgorithmWorldState, Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { cellKey } from "../algorithmWorld";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawAlgorithmWorld(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  top: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang = "en",
) {
  drawWorldPanel(ctx, frame.world!, { x: padding, y: top, w, h, theme, lang, label: frame.world?.algorithmName });
}

export function drawAlgorithmWorldComparison(
  ctx: CanvasRenderingContext2D,
  compare: AlgorithmWorldCompareState,
  padding: number,
  top: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang = "en",
) {
  const isPortrait = h > w * 0.95;
  const gap = Math.max(18, Math.round((isPortrait ? h : w) * 0.018));
  if (isPortrait) {
    const panelH = (h - gap) / 2;
    drawWorldPanel(ctx, compare.left, { x: padding, y: top, w, h: panelH, theme, lang, label: compare.left.algorithmName });
    drawWorldPanel(ctx, compare.right, { x: padding, y: top + panelH + gap, w, h: panelH, theme, lang, label: compare.right.algorithmName });
    return;
  }
  const panelW = (w - gap) / 2;
  drawWorldPanel(ctx, compare.left, { x: padding, y: top, w: panelW, h, theme, lang, label: compare.left.algorithmName });
  drawWorldPanel(ctx, compare.right, { x: padding + panelW + gap, y: top, w: panelW, h, theme, lang, label: compare.right.algorithmName });
}

type PanelOpts = { x: number; y: number; w: number; h: number; theme: Theme; lang: Lang; label?: string };

function drawWorldPanel(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, opts: PanelOpts) {
  const { x, y, w, h, theme, lang } = opts;
  const isPortrait = h > w * 0.95;
  const footerH = Math.min(150, Math.max(92, h * (isPortrait ? 0.13 : 0.18)));
  const labelH = opts.label ? 38 : 0;
  const mazeTop = y + labelH + 12;
  const mazeAreaH = h - footerH - labelH - 26;
  const cell = Math.floor(Math.min((w - 28) / world.cols, mazeAreaH / world.rows));
  const gridW = cell * world.cols;
  const gridH = cell * world.rows;
  const gridX = x + (w - gridW) / 2;
  const gridY = mazeTop + Math.max(4, (mazeAreaH - gridH) / 2);

  const raceMode = world.presentationMode === "vehicle_race";
  const visible = raceMode ? new Set((world.visibleCells ?? []).map(cellKey)) : null;
  const visibleWalls = visible ? world.walls.filter((item) => visible.has(cellKey(item))) : world.walls;
  const visibleDynamicWalls = visible ? world.dynamicWalls.filter((item) => visible.has(cellKey(item))) : world.dynamicWalls;

  drawSceneCard(ctx, x, y, w, h, theme);
  if (opts.label) drawPanelLabel(ctx, opts.label, world.runtimeLabel ?? "", x, y + 14, w, theme);
  drawMazeBase(ctx, world.cols, world.rows, cell, gridX, gridY);
  if (raceMode) drawFogOfWar(ctx, world, visible ?? new Set(), cell, gridX, gridY);
  drawCells(ctx, world.closedSet, cell, gridX, gridY, "rgba(99,102,241,0.42)", "rgba(129,140,248,0.8)");
  drawCells(ctx, world.openSet, cell, gridX, gridY, "rgba(34,211,238,0.34)", "rgba(103,232,249,0.8)");
  if (!raceMode || world.phase === "done") drawPath(ctx, world.previousPath, cell, gridX, gridY, "rgba(148,163,184,0.32)", 0, true);
  drawPath(ctx, world.shatteredPath ?? [], cell, gridX, gridY, "rgba(248,113,113,0.9)", 8, true);
  drawWalls(ctx, visibleWalls, cell, gridX, gridY, false);
  drawWalls(ctx, visibleDynamicWalls, cell, gridX, gridY, true);
  drawCells(ctx, world.pulseCells ?? [], cell, gridX, gridY, "rgba(251,113,133,0.62)", "#fecdd3");
  drawPath(ctx, world.path, cell, gridX, gridY, raceMode ? "#facc15" : "#a3e635", 16, false);
  drawEndpoint(ctx, world.start, cell, gridX, gridY, "#22d3ee", label(lang, "VÀO", "IN"));
  drawEndpoint(ctx, world.goal, cell, gridX, gridY, "#f43f5e", label(lang, "RA", "OUT"));
  if (world.current) raceMode ? drawVehicle(ctx, world, cell, gridX, gridY, theme) : drawCurrent(ctx, world.current, cell, gridX, gridY, theme.highlight);
  drawHud(ctx, world, x + 14, y + h - footerH + 12, w - 28, footerH - 24, theme, lang);
}

function drawSceneCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: Theme) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "rgba(15,23,42,0.34)");
  grad.addColorStop(1, "rgba(2,6,23,0.76)");
  ctx.fillStyle = grad;
  ctx.strokeStyle = `${theme.highlight}55`;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y + 2, w, h - 4, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPanelLabel(ctx: CanvasRenderingContext2D, label: string, runtime: string, x: number, y: number, w: number, theme: Theme) {
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.64)";
  ctx.strokeStyle = `${theme.highlight}66`;
  roundRect(ctx, x + 14, y, w - 28, 34, 12);
  ctx.fill(); ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "800 16px ui-sans-serif, system-ui";
  ctx.fillStyle = "#fff";
  ctx.fillText(label, x + 28, y + 17);
  ctx.textAlign = "right";
  ctx.font = "700 13px ui-monospace, monospace";
  ctx.fillStyle = "#fde047";
  ctx.fillText(runtime, x + w - 28, y + 17);
  ctx.restore();
}

function drawMazeBase(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.9)";
  roundRect(ctx, x - 8, y - 8, cell * cols + 16, cell * rows + 16, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.2)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= cols; col++) {
    ctx.beginPath(); ctx.moveTo(x + col * cell, y); ctx.lineTo(x + col * cell, y + rows * cell); ctx.stroke();
  }
  for (let row = 0; row <= rows; row++) {
    ctx.beginPath(); ctx.moveTo(x, y + row * cell); ctx.lineTo(x + cols * cell, y + row * cell); ctx.stroke();
  }
  ctx.restore();
}

function drawFogOfWar(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, visible: Set<string>, cell: number, x: number, y: number) {
  ctx.save();
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      if (visible.has(`${col},${row}`)) continue;
      ctx.fillStyle = "rgba(2,6,23,0.82)";
      ctx.fillRect(x + col * cell + 1, y + row * cell + 1, cell - 2, cell - 2);
      ctx.strokeStyle = "rgba(15,23,42,0.9)";
      ctx.strokeRect(x + col * cell + 1, y + row * cell + 1, cell - 2, cell - 2);
    }
  }
  ctx.restore();
}

function drawWalls(ctx: CanvasRenderingContext2D, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  ctx.save();
  const keys = new Set(cells.map(cellKey));
  cells.forEach((c) => {
    const px = x + c.x * cell;
    const py = y + c.y * cell;
    ctx.fillStyle = dynamic ? "rgba(244,63,94,0.84)" : "rgba(30,41,59,0.94)";
    ctx.strokeStyle = dynamic ? "#fecdd3" : "rgba(148,163,184,0.28)";
    ctx.lineWidth = dynamic ? 2 : 1;
    roundRect(ctx, px + 1, py + 1, cell - 2, cell - 2, Math.max(3, cell * 0.18));
    ctx.fill(); ctx.stroke();
    if (dynamic && !keys.has(`${c.x},${c.y - 1}`)) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(px + 3, py + 3, Math.max(2, cell - 6), Math.max(2, cell * 0.16));
    }
  });
  ctx.restore();
}

function drawCells(ctx: CanvasRenderingContext2D, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, fill: string, stroke: string) {
  ctx.save();
  cells.forEach((c) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.4;
    roundRect(ctx, x + c.x * cell + 2, y + c.y * cell + 2, cell - 4, cell - 4, Math.max(3, cell * 0.2));
    ctx.fill(); ctx.stroke();
  });
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, path: AlgorithmWorldCell[], cell: number, x: number, y: number, color: string, glow: number, dashed: boolean) {
  if (path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, cell * 0.24);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (dashed) ctx.setLineDash([cell * 0.55, cell * 0.35]);
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.beginPath();
  path.forEach((c, i) => {
    const cx = x + c.x * cell + cell / 2;
    const cy = y + c.y * cell + cell / 2;
    if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
  });
  ctx.stroke();
  ctx.restore();
}

function drawEndpoint(ctx: CanvasRenderingContext2D, c: AlgorithmWorldCell, cell: number, x: number, y: number, color: string, text: string) {
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  roundRect(ctx, cx - cell * 0.48, cy - cell * 0.34, cell * 0.96, cell * 0.68, Math.max(5, cell * 0.18));
  ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.font = `800 ${Math.max(9, cell * 0.34)}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

function drawCurrent(ctx: CanvasRenderingContext2D, c: AlgorithmWorldCell, cell: number, x: number, y: number, color: string) {
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(cx, cy, cell * 0.48, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawVehicle(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, cell: number, x: number, y: number, theme: Theme) {
  if (!world.current) return;
  const c = world.current;
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  const bodyW = Math.max(12, cell * 0.9);
  const bodyH = Math.max(8, cell * 0.56);
  const color = vehicleColor(world.algorithmId, theme);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = Math.max(1.5, cell * 0.08);
  roundRect(ctx, cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.18));
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(2,6,23,0.9)";
  ctx.beginPath(); ctx.arc(cx - bodyW * 0.3, cy + bodyH * 0.48, Math.max(2, cell * 0.12), 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + bodyW * 0.3, cy + bodyH * 0.48, Math.max(2, cell * 0.12), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(cx + bodyW * 0.36, cy);
  ctx.lineTo(cx + bodyW * 0.12, cy - bodyH * 0.2);
  ctx.lineTo(cx + bodyW * 0.12, cy + bodyH * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function vehicleColor(id: AlgorithmWorldState["algorithmId"], theme: Theme) {
  if (id === "dfs") return "#fb7185";
  if (id === "bfs") return "#38bdf8";
  if (id === "dijkstra") return "#facc15";
  if (id === "astar") return "#34d399";
  return theme.highlight;
}

function drawHud(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, x: number, y: number, w: number, h: number, theme: Theme, lang: Lang) {
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,0.76)";
  ctx.strokeStyle = `${theme.highlight}77`;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill(); ctx.stroke();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = "700 13px ui-sans-serif, system-ui";
  ctx.fillStyle = "#a5f3fc";
  wrap(ctx, localizedStatus(world, lang), w - 28).slice(0, 2).forEach((line, index) => ctx.fillText(line, x + 14, y + 12 + index * 17));

  const rows = [
    [label(lang, "Pha", "Phase"), phaseLabel(world.phase, lang)],
    [label(lang, "Runtime", "Runtime"), world.runtimeLabel ?? "—"],
    [label(lang, "Bước", "Steps"), String(world.stepCount ?? "—")],
    [label(lang, "Đã thăm", "Visited"), String(world.visitedCount ?? world.closedSet.length)],
    [label(lang, "Độ dài path", "Path length"), String((world.pathLength ?? world.path.length) || "—")],
    ["f = g + h", String(world.scores?.f ?? "—")],
  ];
  const startY = y + Math.min(52, h * 0.42);
  const colW = w / rows.length;
  rows.forEach(([k, v], i) => {
    const xx = x + i * colW + 10;
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = "600 10px ui-sans-serif, system-ui";
    ctx.fillText(k, xx, startY);
    ctx.fillStyle = k === "f = g + h" ? "#fde047" : "#fff";
    ctx.font = "800 13px ui-monospace, monospace";
    ctx.fillText(v, xx, startY + 16);
  });
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width > maxW && current) { lines.push(current); current = word; }
    else current = trial;
  }
  if (current) lines.push(current);
  return lines;
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}

function localizedStatus(world: AlgorithmWorldState, lang: Lang) {
  const algo = world.algorithmName ?? "Algorithm";
  if (world.presentationMode === "vehicle_race" && world.phase !== "done") return label(lang, `Xe ${algo} chỉ nhìn vùng đã dò được, không thấy toàn bộ bản đồ.`, `${algo} car only sees discovered cells, not the full map.`);
  if (world.phase === "setup") return label(lang, `${algo} bắt đầu ở lối vào và tìm đường ra.`, `${algo} starts at the maze entrance and looks for the exit.`);
  if (world.phase === "obstacle") return label(lang, "Tường realtime xuất hiện, đường cũ bị phá nên thuật toán phải tính lại.", "Real-time walls appear, breaking the old route and forcing a recalculation.");
  if (world.phase === "replan") return label(lang, `${algo} đang tính lại sau khi mê cung thay đổi.`, `${algo} replans after the maze changed.`);
  if (world.phase === "done") return label(lang, `${algo} đã tìm được đường hoàn chỉnh từ lối vào đến lối ra.`, `${algo} found a complete entrance-to-exit path.`);
  return label(lang, `${algo} mở rộng các ô có thể đi trong mê cung.`, `${algo} expands reachable cells in the maze.`);
}

function phaseLabel(phase: string, lang: Lang) {
  const map: Record<string, { vi: string; en: string }> = {
    setup: { vi: "chuẩn bị", en: "setup" },
    search: { vi: "tìm đường", en: "search" },
    path: { vi: "đường đi", en: "path" },
    obstacle: { vi: "vật cản", en: "obstacle" },
    replan: { vi: "tính lại", en: "replan" },
    done: { vi: "xong", en: "done" },
  };
  return map[phase]?.[lang] ?? phase;
}
