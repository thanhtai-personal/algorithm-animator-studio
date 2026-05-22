import type { AlgorithmWorldCell, AlgorithmWorldCompareState, AlgorithmWorldState, Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { cellKey } from "../algorithmWorld";
import { drawRaceIntroOverlay, drawRaceTrackBase, drawRaceWalls, drawRaceWinner, shouldDrawRaceIntroOnly } from "./algorithmWorldRaceRenderer";
import { drawVehicle, vehicleColorForWorld } from "./algorithmWorldVehicleRenderer";
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
  const raceMode = compare.left.presentationMode === "vehicle_race";
  const gap = raceMode ? Math.max(12, Math.round(h * 0.012)) : Math.max(18, Math.round((isPortrait ? h : w) * 0.018));
  const x0 = raceMode ? Math.max(8, padding * 0.35) : padding, w0 = raceMode ? w + (padding - x0) * 2 : w, top0 = raceMode ? top - 20 : top, h0 = raceMode ? h + 20 : h;
  if (shouldDrawRaceIntroOnly(compare)) {
    drawRaceIntroOverlay(ctx, compare, x0, top0, w0, h0, theme, lang);
    return;
  }
  if (isPortrait) {
    const panelH = (h0 - gap) / 2;
    drawWorldPanel(ctx, compare.left, { x: x0, y: top0, w: w0, h: panelH, theme, lang, label: compare.left.algorithmName });
    drawWorldPanel(ctx, compare.right, { x: x0, y: top0 + panelH + gap, w: w0, h: panelH, theme, lang, label: compare.right.algorithmName });
    drawRaceIntroOverlay(ctx, compare, x0, top0, w0, h0, theme, lang);
    return;
  }
  const panelW = (w0 - gap) / 2;
  drawWorldPanel(ctx, compare.left, { x: x0, y: top0, w: panelW, h: h0, theme, lang, label: compare.left.algorithmName });
  drawWorldPanel(ctx, compare.right, { x: x0 + panelW + gap, y: top0, w: panelW, h: h0, theme, lang, label: compare.right.algorithmName });
  drawRaceIntroOverlay(ctx, compare, x0, top0, w0, h0, theme, lang);
}

type PanelOpts = { x: number; y: number; w: number; h: number; theme: Theme; lang: Lang; label?: string };

function drawWorldPanel(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, opts: PanelOpts) {
  const { x, y, w, h, theme, lang } = opts;
  const isPortrait = h > w * 0.95;
  const raceMode = world.presentationMode === "vehicle_race";
  const footerH = raceMode ? Math.min(156, Math.max(96, h * (isPortrait ? 0.13 : 0.18))) : Math.min(190, Math.max(120, h * (isPortrait ? 0.16 : 0.22)));
  const labelH = opts.label ? raceMode ? 40 : 48 : 0;
  const mazeTop = y + labelH + (raceMode ? 7 : 12);
  const mazeAreaH = h - footerH - labelH - (raceMode ? 14 : 26);
  const cell = Math.floor(Math.min((w - (raceMode ? 12 : 28)) / world.cols, mazeAreaH / world.rows));
  const gridW = cell * world.cols;
  const gridH = cell * world.rows;
  const gridX = x + (w - gridW) / 2;
  const gridY = mazeTop + Math.max(4, (mazeAreaH - gridH) / 2);

  const visible: Set<string> | null = null;
  const visibleWalls = visible ? world.walls.filter((item) => visible.has(cellKey(item))) : world.walls;
  const visibleDynamicWalls = visible ? world.dynamicWalls.filter((item) => visible.has(cellKey(item))) : world.dynamicWalls;

  drawSceneCard(ctx, x, y, w, h, theme);
  if (opts.label) drawPanelLabel(ctx, opts.label, world.runtimeLabel ?? "", x, y + 14, w, theme);
  raceMode ? drawRaceTrackBase(ctx, world.cols, world.rows, cell, gridX, gridY) : drawMazeBase(ctx, world.cols, world.rows, cell, gridX, gridY);
  if (raceMode) drawRaceTimer(ctx, world, gridX + gridW - 4, gridY - Math.max(44, cell * 1.35), true);
  drawCells(ctx, world.closedSet, cell, gridX, gridY, "rgba(99,102,241,0.42)", "rgba(129,140,248,0.8)");
  drawCells(ctx, world.openSet, cell, gridX, gridY, "rgba(34,211,238,0.34)", "rgba(103,232,249,0.8)");
  if (!raceMode) drawPath(ctx, world.previousPath, cell, gridX, gridY, "rgba(148,163,184,0.32)", 0, true);
  drawPath(ctx, world.shatteredPath ?? [], cell, gridX, gridY, "rgba(248,113,113,0.9)", 8, true);
  raceMode ? drawRaceWalls(ctx, visibleWalls, cell, gridX, gridY, false) : drawWalls(ctx, visibleWalls, cell, gridX, gridY, false);
  raceMode ? drawRaceWalls(ctx, visibleDynamicWalls, cell, gridX, gridY, true) : drawWalls(ctx, visibleDynamicWalls, cell, gridX, gridY, true);
  drawCells(ctx, world.pulseCells ?? [], cell, gridX, gridY, "rgba(251,113,133,0.62)", "#fecdd3");
  drawPath(ctx, world.path, cell, gridX, gridY, raceMode ? vehicleColorForWorld(world, theme) : "#a3e635", 16, false);
  drawEndpoint(ctx, world.start, cell, gridX, gridY, "#22d3ee", label(lang, "VÀO", "IN"));
  drawEndpoint(ctx, world.goal, cell, gridX, gridY, "#f43f5e", label(lang, "RA", "OUT"));
  if (world.current) raceMode ? drawVehicle(ctx, world, cell, gridX, gridY, theme) : drawCurrent(ctx, world.current, cell, gridX, gridY, theme.highlight);
  if (raceMode && world.raceWinner) drawRaceWinner(ctx, world, gridX + gridW / 2, gridY + gridH / 2, gridW, gridH, theme, lang);
  drawHud(ctx, world, x + (raceMode ? 8 : 14), y + h - footerH + (raceMode ? 6 : 12), w - (raceMode ? 16 : 28), footerH - (raceMode ? 12 : 24), theme, lang);
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
  roundRect(ctx, x + 14, y, w - 28, 44, 12);
  ctx.fill(); ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "900 24px ui-sans-serif, system-ui";
  ctx.fillStyle = "#fff";
  ctx.fillText(label, x + 28, y + 22);
  ctx.textAlign = "right";
  ctx.font = "800 18px ui-monospace, monospace";
  ctx.fillStyle = "#fde047";
  ctx.fillText(runtime, x + w - 28, y + 22);
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
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 12);
  ctx.clip();
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const raceMode = world.presentationMode === "vehicle_race";
  ctx.font = raceMode ? "800 14px ui-sans-serif, system-ui" : "800 18px ui-sans-serif, system-ui";
  ctx.fillStyle = world.raceWinner ? "#fde047" : "#a5f3fc";
  const statusWidth = raceMode ? Math.max(90, w - 174) : w - 28;
  wrap(ctx, localizedStatus(world, lang), statusWidth).slice(0, raceMode ? 1 : 2).forEach((line, index) => ctx.fillText(line, x + 14, y + 12 + index * 17, statusWidth));

  if (raceMode) drawRaceTimer(ctx, world, x + w - 14, y + 12);
  const rows = raceMode
    ? [
      [label(lang, "Thuật toán", "Algorithm"), world.algorithmName ?? "—"],
      [label(lang, "Đã xét", "Visited"), String(world.visitedCount ?? world.closedSet.length)],
      [label(lang, "Độ dài", "Path"), String((world.pathLength ?? world.path.length) || "—")],
      [label(lang, "Kết quả", "Result"), world.raceWinner ? "WIN" : world.raceFinished ? label(lang, "Về đích", "Done") : label(lang, "Đang chạy", "Running")],
    ]
    : [
      [label(lang, "Pha", "Phase"), phaseLabel(world.phase, lang)],
      [label(lang, "Runtime", "Runtime"), world.runtimeLabel ?? "—"],
      [label(lang, "Bước", "Steps"), String(world.stepCount ?? "—")],
      [label(lang, "Đã thăm", "Visited"), String(world.visitedCount ?? world.closedSet.length)],
      [label(lang, "Độ dài path", "Path length"), String((world.pathLength ?? world.path.length) || "—")],
      ["f = g + h", String(world.scores?.f ?? "—")],
    ];
  const startY = raceMode ? y + Math.min(50, h * 0.48) : y + Math.min(52, h * 0.42);
  const colW = w / rows.length;
  rows.forEach(([k, v], i) => {
    const xx = x + i * colW + 10;
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = raceMode ? "700 11px ui-sans-serif, system-ui" : "700 14px ui-sans-serif, system-ui";
    ctx.fillText(k, xx, startY, colW - 18);
    ctx.fillStyle = k === "f = g + h" || world.raceWinner && i === rows.length - 1 ? "#fde047" : "#fff";
    ctx.font = raceMode ? "900 13px ui-monospace, monospace" : "900 18px ui-monospace, monospace";
    ctx.fillText(v, xx, startY + (raceMode ? 13 : 16), colW - 18);
  });
  ctx.restore();
}

function drawRaceTimer(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, x: number, y: number) {
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = world.raceWinner ? "#fde047" : "#fff";
  ctx.font = "900 28px ui-monospace, monospace";
  ctx.fillText(formatRaceTime(world.raceTime ?? world.stepCount ?? 0), x, y);
  ctx.fillStyle = world.raceFinished ? "#fde047" : "rgba(148,163,184,0.9)";
  ctx.font = "900 14px ui-sans-serif, system-ui";
  ctx.fillText(world.raceFinished ? "STOP" : "RUN", x, y + 34);
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
  if (world.presentationMode === "vehicle_race") {
    if (world.raceWinner) return label(lang, `${algo} tới đích trước. Đồng hồ đã dừng.`, `${algo} finishes first. Timer stopped.`);
    if (world.raceFinished) return label(lang, `${algo} đã tới điểm ra. Đồng hồ đã dừng.`, `${algo} reached the exit. Timer stopped.`);
    return label(lang, `Xe ${algo} chỉ chạy sang ô lân cận không bị tường chắn.`, `${algo} car moves only to adjacent unblocked cells.`);
  }
  if (world.phase === "setup") return label(lang, `${algo} bắt đầu ở lối vào và tìm đường ra.`, `${algo} starts at the maze entrance and looks for the exit.`);
  if (world.phase === "obstacle") return label(lang, "Tường realtime xuất hiện, đường cũ bị phá nên thuật toán phải tính lại.", "Real-time walls appear, breaking the old route and forcing a recalculation.");
  if (world.phase === "replan") return label(lang, `${algo} đang tính lại sau khi mê cung thay đổi.`, `${algo} replans after the maze changed.`);
  if (world.phase === "done") return label(lang, `${algo} đã tìm được đường hoàn chỉnh từ lối vào đến lối ra.`, `${algo} found a complete entrance-to-exit path.`);
  return label(lang, `${algo} mở rộng các ô có thể đi trong mê cung.`, `${algo} expands reachable cells in the maze.`);
}

function formatRaceTime(value: number) {
  return `${Math.max(0, value).toString().padStart(2, "0")} tick`;
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
