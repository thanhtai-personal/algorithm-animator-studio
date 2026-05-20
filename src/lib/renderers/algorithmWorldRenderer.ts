import type { Frame, AlgorithmWorldCell } from "../algorithms";
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
  const world = frame.world!;
  const isPortrait = h > w * 0.9;
  const hudW = isPortrait ? 0 : Math.min(310, w * 0.3);
  const mazeW = w - hudW - (isPortrait ? 0 : 18);
  const mazeH = isPortrait ? h * 0.76 : h - 8;
  const cell = Math.floor(Math.min(mazeW / world.cols, mazeH / world.rows));
  const gridW = cell * world.cols;
  const gridH = cell * world.rows;
  const gridX = padding + (mazeW - gridW) / 2;
  const gridY = top + Math.max(8, (mazeH - gridH) / 2);

  drawSceneCard(ctx, padding, top, w, h, theme);
  drawMazeBase(ctx, world.cols, world.rows, cell, gridX, gridY);
  drawCells(ctx, world.closedSet, cell, gridX, gridY, "rgba(99,102,241,0.45)", "rgba(129,140,248,0.9)");
  drawCells(ctx, world.openSet, cell, gridX, gridY, "rgba(34,211,238,0.38)", "rgba(103,232,249,0.85)");
  drawPath(ctx, world.previousPath, cell, gridX, gridY, "rgba(148,163,184,0.35)", 0, true);
  drawPath(ctx, world.shatteredPath ?? [], cell, gridX, gridY, "rgba(248,113,113,0.88)", 7, true);
  drawWalls(ctx, world.walls, cell, gridX, gridY, false);
  drawWalls(ctx, world.dynamicWalls, cell, gridX, gridY, true);
  drawCells(ctx, world.pulseCells ?? [], cell, gridX, gridY, "rgba(251,113,133,0.65)", "#fecdd3");
  drawPath(ctx, world.path, cell, gridX, gridY, "#a3e635", 14, false);
  drawEndpoint(ctx, world.start, cell, gridX, gridY, "#22d3ee", "S");
  drawEndpoint(ctx, world.goal, cell, gridX, gridY, "#f43f5e", "G");
  if (world.current) drawCurrent(ctx, world.current, cell, gridX, gridY, theme.highlight);
  drawStatus(ctx, world.status, padding, top, w, lang);

  const hudX = isPortrait ? padding + 10 : gridX + gridW + 18;
  const hudY = isPortrait ? gridY + gridH + 16 : top + 54;
  const hudWidth = isPortrait ? w - 20 : hudW - 12;
  drawHud(ctx, frame, hudX, hudY, hudWidth, world.phase, theme, lang);
}

function drawSceneCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: Theme) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "rgba(15,23,42,0.38)");
  grad.addColorStop(1, "rgba(2,6,23,0.72)");
  ctx.fillStyle = grad;
  ctx.strokeStyle = `${theme.highlight}55`;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y + 2, w, h - 4, 24);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMazeBase(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.88)";
  roundRect(ctx, x - 8, y - 8, cell * cols + 16, cell * rows + 16, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.18)";
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
    ctx.fillStyle = dynamic ? "rgba(244,63,94,0.82)" : "rgba(30,41,59,0.94)";
    ctx.strokeStyle = dynamic ? "#fecdd3" : "rgba(148,163,184,0.28)";
    ctx.lineWidth = dynamic ? 2 : 1;
    roundRect(ctx, px + 1, py + 1, cell - 2, cell - 2, Math.max(3, cell * 0.18));
    ctx.fill(); ctx.stroke();
    if (dynamic && !keys.has(`${c.x},${c.y - 1}`)) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(px + 3, py + 3, cell - 6, Math.max(2, cell * 0.16));
    }
  });
  ctx.restore();
}

function drawCells(ctx: CanvasRenderingContext2D, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, fill: string, stroke: string) {
  ctx.save();
  cells.forEach((c) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x + c.x * cell + 3, y + c.y * cell + 3, cell - 6, cell - 6, Math.max(4, cell * 0.24));
    ctx.fill(); ctx.stroke();
  });
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, path: AlgorithmWorldCell[], cell: number, x: number, y: number, color: string, glow: number, dashed: boolean) {
  if (path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(4, cell * 0.26);
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
  ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.font = `800 ${Math.max(12, cell * 0.52)}px ui-sans-serif, system-ui`;
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
  ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(cx, cy, cell * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawStatus(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, lang: Lang) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `700 ${Math.max(16, Math.min(24, w * 0.035))}px ui-sans-serif, system-ui`;
  const lines = wrap(ctx, text, w - 42);
  const boxH = 18 + lines.length * 26;
  ctx.fillStyle = "rgba(8,47,73,0.82)";
  ctx.strokeStyle = "rgba(34,211,238,0.65)";
  roundRect(ctx, x + 16, y + 10, w - 32, boxH, 16);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#a5f3fc";
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + 34 + i * 26));
  if (lang === "vi") {
    ctx.font = "500 12px ui-sans-serif, system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.fillText("A* World Mode", x + w / 2, y + boxH + 2);
  }
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, phase: string, theme: Theme, lang: Lang) {
  ctx.save();
  const rows = [
    [label(lang, "Pha", "Phase"), phase],
    ["g", String(frame.vars.g ?? "—")],
    ["h", String(frame.vars.h ?? "—")],
    ["f = g + h", String(frame.vars.f ?? "—")],
    [label(lang, "Open", "Open"), String(frame.vars.open ?? 0)],
    [label(lang, "Closed", "Closed"), String(frame.vars.closed ?? 0)],
    [label(lang, "Replan", "Replan"), String(frame.vars.replan ?? 0)],
  ];
  ctx.fillStyle = "rgba(2,6,23,0.7)";
  ctx.strokeStyle = `${theme.highlight}77`;
  roundRect(ctx, x, y, w, rows.length * 32 + 30, 18);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "800 18px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.fillText(label(lang, "BẢNG TÍNH A*", "A* CONTROL PANEL"), x + 16, y + 26);
  ctx.font = "600 15px ui-monospace, monospace";
  rows.forEach(([k, v], i) => {
    const yy = y + 58 + i * 32;
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fillText(k, x + 16, yy);
    ctx.fillStyle = k === "f = g + h" ? "#fde047" : "#a5f3fc";
    ctx.textAlign = "right";
    ctx.fillText(v, x + w - 16, yy);
    ctx.textAlign = "left";
  });
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width > maxW && current) {
      lines.push(current);
      current = word;
    } else current = trial;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}
