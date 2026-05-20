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
  const gap = Math.max(18, Math.round(w * 0.018));
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

  drawSceneCard(ctx, x, y, w, h, theme);
  if (opts.label) drawPanelLabel(ctx, opts.label, world.runtimeLabel ?? "", x, y + 14, w, theme);
  drawMazeBase(ctx, world.cols, world.rows, cell, gridX, gridY);
  drawCells(ctx, world.closedSet, cell, gridX, gridY, "rgba(99,102,241,0.42)", "rgba(129,140,248,0.8)");
  drawCells(ctx, world.openSet, cell, gridX, gridY, "rgba(34,211,238,0.34)", "rgba(103,232,249,0.8)");
  drawPath(ctx, world.previousPath, cell, gridX, gridY, "rgba(148,163,184,0.32)", 0, true);
  drawPath(ctx, world.shatteredPath ?? [], cell, gridX, gridY, "rgba(248,113,113,0.9)", 8, true);
  drawWalls(ctx, world.walls, cell, gridX, gridY, false);
  drawWalls(ctx, world.dynamicWalls, cell, gridX, gridY, true);
  drawCells(ctx, world.pulseCells ?? [], cell, gridX, gridY, "rgba(251,113,133,0.62)", "#fecdd3");
  drawPath(ctx, world.path, cell, gridX, gridY, "#a3e635", 16, false);
  drawEndpoint(ctx, world.start, cell, gridX, gridY, "#22d3ee", "IN");
  drawEndpoint(ctx, world.goal, cell, gridX, gridY, "#f43f5e", "OUT");
  if (world.current) drawCurrent(ctx, world.current, cell, gridX, gridY, theme.highlight);
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
  wrap(ctx, world.status, w - 28).slice(0, 2).forEach((line, index) => ctx.fillText(line, x + 14, y + 12 + index * 17));

  const rows = [
    [label(lang, "Pha", "Phase"), world.phase],
    [label(lang, "Runtime", "Runtime"), world.runtimeLabel ?? "—"],
    [label(lang, "Visited", "Visited"), String(world.visitedCount ?? world.closedSet.length)],
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
