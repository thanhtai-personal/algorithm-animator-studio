import Phaser from "phaser";
import type { AlgorithmWorldCell, AlgorithmWorldState } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import { cellKey } from "@/lib/algorithmWorld";
import { drawRaceTrackBase, drawRaceWalls } from "./PhaserMazeRaceStyle";
import { COLORS, type MazeTextRenderer } from "./phaserMazePreviewShared";

export function drawWorld(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, x: number, y: number, w: number, h: number, pulse: number, lang: Lang, large: boolean) {
  g.fillStyle(COLORS.panel, 0.9);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(2, COLORS.open, 0.28 + pulse * 0.18);
  g.strokeRoundedRect(x, y, w, h, 16);
  const labelH = large ? 58 : 42;
  const raceMode = world.presentationMode === "vehicle_race";
  const winnerMode = raceMode && world.raceWinner;
  if (!winnerMode) {
    scene.text(world.algorithmName ?? "A*", x + 16, y + labelH / 2, large ? 34 : 30, COLORS.text, "left", 900);
    scene.text(world.runtimeLabel ?? "", x + w - 16, y + labelH / 2, large ? 24 : 20, COLORS.yellow, "right", 800);
  }

  const hudH = large ? 152 : 108;
  const mazeY = y + labelH + 8;
  const mazeH = h - labelH - hudH - 18;
  const cell = Math.floor(Math.min((w - 22) / world.cols, mazeH / world.rows));
  const gridW = cell * world.cols;
  const gridH = cell * world.rows;
  const gridX = x + (w - gridW) / 2;
  const gridY = mazeY + Math.max(0, (mazeH - gridH) / 2);
  const visible = null;
  raceMode ? drawRaceTrackBase(g, world.cols, world.rows, cell, gridX, gridY) : drawGrid(g, world.cols, world.rows, cell, gridX, gridY);
  if (raceMode && !winnerMode) {
    scene.text(formatRaceTime(world.raceTime ?? world.stepCount ?? 0), gridX + gridW - 4, gridY - Math.max(40, cell * 1.25), large ? 44 : 34, world.raceWinner ? COLORS.yellow : COLORS.text, "right", 900);
  }
  if (visible) drawFog(g, world, visible, cell, gridX, gridY);
  drawCellSet(g, world.closedSet, cell, gridX, gridY, COLORS.closed, 0.36);
  drawCellSet(g, world.openSet, cell, gridX, gridY, COLORS.open, 0.28 + pulse * 0.18);
  if (!raceMode) drawPath(g, world.previousPath, cell, gridX, gridY, COLORS.oldPath, 0.42, true);
  drawPath(g, world.shatteredPath ?? [], cell, gridX, gridY, COLORS.danger, 0.88, true);
  raceMode ? drawRaceWalls(g, filterVisible(world.walls, visible), cell, gridX, gridY, false) : drawWalls(g, filterVisible(world.walls, visible), cell, gridX, gridY, false);
  raceMode ? drawRaceWalls(g, filterVisible(world.dynamicWalls, visible), cell, gridX, gridY, true) : drawWalls(g, filterVisible(world.dynamicWalls, visible), cell, gridX, gridY, true);
  drawCellSet(g, world.pulseCells ?? [], cell, gridX, gridY, COLORS.danger, 0.55 + pulse * 0.3);
  drawPath(g, world.path, cell, gridX, gridY, raceMode ? algorithmColor(world) : COLORS.path, 0.95, false);
  if (!winnerMode) {
    drawPortal(scene, g, world.start, cell, gridX, gridY, COLORS.start, lang === "vi" ? "VÀO" : "IN");
    drawPortal(scene, g, world.goal, cell, gridX, gridY, COLORS.goal, lang === "vi" ? "RA" : "OUT");
  }
  if (world.current) drawRunner(g, world, cell, gridX, gridY, algorithmColor(world), pulse);
  if (winnerMode) {
    g.fillStyle(COLORS.bg, 0.82);
    g.fillRoundedRect(x + 8, y + 8, w - 16, h - 16, 20);
    drawWinnerOverlay(scene, g, world, x + w / 2, y + h / 2, w * 0.86, h * 0.52, lang);
  } else {
    drawHud(scene, g, world, x + 10, y + h - hudH - 8, w - 20, hudH, lang, large);
  }
}

function drawWinnerOverlay(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, cx: number, cy: number, w: number, h: number, lang: Lang) {
  const age = world.raceWinAge ?? 0;
  const pop = age < 10 ? 0.72 + age * 0.04 : 1 + Math.sin(age * 0.45) * 0.035;
  const base = Math.min(1, Math.max(0.56, h / 210));
  const alpha = Math.min(0.96, 0.3 + age * 0.12);
  const boxW = Math.min(w * 0.9, 720) * pop;
  const boxH = Math.min(h * 0.74, 150 * base) * pop;
  g.fillStyle(COLORS.yellow, 0.16);
  g.fillCircle(cx, cy, boxW * 0.66);
  g.fillStyle(0x020617, alpha);
  g.fillRoundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 22);
  g.lineStyle(Math.max(3, 4 * pop), COLORS.yellow, 0.92);
  g.strokeRoundedRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 22);
  g.fillStyle(COLORS.yellow, 1);
  g.fillRoundedRect(cx - boxW * 0.28, cy - boxH / 2 - 14 * base * pop, boxW * 0.56, 28 * base * pop, 14 * base * pop);
  scene.text("WINNER", cx, cy - boxH / 2 - pop, Math.round(14 * base * pop), COLORS.bg, "center", 900);
  scene.text(world.algorithmName ?? "Algorithm", cx, cy - 6 * base * pop, Math.round(46 * base * pop), COLORS.yellow, "center", 900, boxW * 0.86);
  scene.text(lang === "vi" ? "Xe thắng đã dừng tại cửa ra" : "Winning car stopped at the exit", cx, cy + 34 * base * pop, Math.round(18 * base * pop), COLORS.text, "center", 900, boxW * 0.86);
}

function drawGrid(g: Phaser.GameObjects.Graphics, cols: number, rows: number, cell: number, x: number, y: number) {
  g.fillStyle(0x050b18, 0.95);
  g.fillRoundedRect(x - 10, y - 10, cols * cell + 20, rows * cell + 20, 16);
  g.lineStyle(1, COLORS.grid, 0.82);
  for (let col = 0; col <= cols; col++) g.lineBetween(x + col * cell, y, x + col * cell, y + rows * cell);
  for (let row = 0; row <= rows; row++) g.lineBetween(x, y + row * cell, x + cols * cell, y + row * cell);
}

function drawWalls(g: Phaser.GameObjects.Graphics, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    g.fillStyle(dynamic ? COLORS.danger : COLORS.wall, dynamic ? 0.9 : 0.96);
    g.fillRoundedRect(px, py, cell - 2, cell - 2, Math.max(3, cell * 0.18));
    g.lineStyle(1, dynamic ? 0xfecdd3 : 0x64748b, dynamic ? 0.8 : 0.25);
    g.strokeRoundedRect(px, py, cell - 2, cell - 2, Math.max(3, cell * 0.18));
  });
}

function drawCellSet(g: Phaser.GameObjects.Graphics, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, color: number, alpha: number) {
  cells.forEach((c) => {
    g.fillStyle(color, alpha);
    g.fillRoundedRect(x + c.x * cell + 2, y + c.y * cell + 2, cell - 4, cell - 4, Math.max(3, cell * 0.2));
  });
}

function drawPath(g: Phaser.GameObjects.Graphics, path: AlgorithmWorldCell[], cell: number, x: number, y: number, color: number, alpha: number, dashed: boolean) {
  if (path.length < 2) return;
  g.lineStyle(Math.max(4, cell * 0.26), color, alpha);
  for (let i = 1; i < path.length; i++) {
    if (dashed && i % 2 === 0) continue;
    const a = path[i - 1];
    const b = path[i];
    g.lineBetween(x + a.x * cell + cell / 2, y + a.y * cell + cell / 2, x + b.x * cell + cell / 2, y + b.y * cell + cell / 2);
  }
}

function drawPortal(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, c: AlgorithmWorldCell, cell: number, x: number, y: number, color: number, text: string) {
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  g.fillStyle(color, 0.25);
  g.fillCircle(cx, cy, cell * 0.72);
  g.fillStyle(color, 0.95);
  g.fillRoundedRect(cx - cell * 0.48, cy - cell * 0.34, cell * 0.96, cell * 0.68, Math.max(5, cell * 0.18));
  scene.text(text, cx, cy + 1, Math.max(9, cell * 0.3), 0x020617, "center", 900);
}

function drawRunner(g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, cell: number, x: number, y: number, color: number, pulse: number) {
  if (!world.current) return;
  const c = world.current;
  const cx = x + c.x * cell + cell / 2;
  const cy = y + c.y * cell + cell / 2;
  const shape = world.vehicleShape ?? "sport";
  const bodyW = cell * (shape === "truck" ? 0.96 : shape === "formula" ? 0.76 : 0.86);
  const bodyH = cell * (shape === "truck" ? 0.62 : 0.5);
  g.fillStyle(color, 0.18 + pulse * 0.2);
  g.fillCircle(cx, cy, cell * (0.62 + pulse * 0.12));
  g.fillStyle(color, 0.95);
  g.fillRoundedRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.15));
  if (shape === "formula") {
    g.fillTriangle(cx + bodyW * 0.5, cy, cx + bodyW * 0.15, cy - bodyH * 0.48, cx + bodyW * 0.15, cy + bodyH * 0.48);
  }
  g.fillStyle(0xffffff, 0.82);
  g.fillRoundedRect(cx - bodyW * 0.05, cy - bodyH * 0.3, bodyW * 0.28, bodyH * 0.6, 4);
  g.fillStyle(0x020617, 0.95);
  g.fillCircle(cx - bodyW * 0.3, cy + bodyH * 0.56, Math.max(2, cell * 0.11));
  g.fillCircle(cx + bodyW * 0.3, cy + bodyH * 0.56, Math.max(2, cell * 0.11));
  g.lineStyle(Math.max(2, cell * 0.08), 0xffffff, 0.9);
  g.strokeRoundedRect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, Math.max(4, cell * 0.15));
}

function drawHud(scene: MazeTextRenderer, g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, x: number, y: number, w: number, h: number, lang: Lang, large: boolean) {
  g.fillStyle(0x020617, 0.78);
  g.fillRoundedRect(x, y, w, h, 16);
  g.lineStyle(1, COLORS.open, 0.32);
  g.strokeRoundedRect(x, y, w, h, 16);
  const raceMode = world.presentationMode === "vehicle_race";
  const status = localizedStatus(world, lang);
  const statusWidth = raceMode ? Math.max(90, w - 174) : w - 28;
  scene.text(status, x + 14, y + 18, raceMode ? 15 : large ? 22 : 20, world.raceWinner ? COLORS.yellow : COLORS.open, "left", 800, statusWidth);
  if (raceMode) {
    const timer = formatRaceTime(world.raceTime ?? world.stepCount ?? 0);
    const state = world.raceFinished ? (world.raceWinner ? "WIN" : "DONE") : "RUN";
    scene.text(timer, x + w - 14, y + 16, large ? 30 : 26, world.raceWinner ? COLORS.yellow : COLORS.text, "right", 900, 150);
    scene.text(state, x + w - 14, y + (large ? 50 : 46), large ? 15 : 14, world.raceWinner ? COLORS.yellow : COLORS.muted, "right", 900, 150);
  }
  const stats = raceMode ? [
    [lang === "vi" ? "Thuật toán" : "Algorithm", world.algorithmName ?? "-"],
    [lang === "vi" ? "Đã xét" : "Visited", String(world.visitedCount ?? world.closedSet.length)],
    [lang === "vi" ? "Độ dài" : "Path", String((world.pathLength ?? world.path.length) || "-")],
    [lang === "vi" ? "Kết quả" : "Result", raceResult(world, lang)],
  ] : [
    [lang === "vi" ? "Thuật toán" : "Algorithm", world.algorithmName ?? "-"],
    [lang === "vi" ? "Đồng hồ" : "Timer", formatRaceTime(world.raceTime ?? world.stepCount ?? 0)],
    [lang === "vi" ? "Đã xét" : "Visited", String(world.visitedCount ?? world.closedSet.length)],
    [lang === "vi" ? "Độ dài" : "Path", String((world.pathLength ?? world.path.length) || "-")],
    ["f = g + h", String(world.scores?.f ?? "-")],
  ];
  const startY = raceMode ? y + 54 : y + (large ? 84 : 66);
  stats.forEach(([key, value], index) => {
    const colW = w / stats.length;
    const sx = x + 14 + index * colW;
    scene.text(key, sx, startY, raceMode ? 12 : large ? 16 : 15, COLORS.muted, "left", 700, colW - 20);
    scene.text(value, sx, startY + (raceMode ? 16 : large ? 28 : 24), raceMode ? 15 : large ? 23 : 20, key === "f = g + h" || world.raceWinner && index === stats.length - 1 ? COLORS.yellow : COLORS.text, "left", 900, colW - 20);
  });
}

function drawFog(g: Phaser.GameObjects.Graphics, world: AlgorithmWorldState, visible: Set<string>, cell: number, x: number, y: number) {
  g.fillStyle(0x020617, 0.82);
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      if (!visible.has(`${col},${row}`)) g.fillRect(x + col * cell + 1, y + row * cell + 1, cell - 2, cell - 2);
    }
  }
}

function filterVisible(cells: AlgorithmWorldCell[], visible: Set<string> | null) {
  return visible ? cells.filter((cell) => visible.has(cellKey(cell))) : cells;
}

function algorithmColor(world: AlgorithmWorldState) {
  if (world.vehicleColor) return Phaser.Display.Color.HexStringToColor(world.vehicleColor).color;
  if (world.algorithmId === "dfs") return 0xfb7185;
  if (world.algorithmId === "bfs") return 0x38bdf8;
  if (world.algorithmId === "dijkstra") return 0xfacc15;
  return 0x34d399;
}

function localizedStatus(world: AlgorithmWorldState, lang: Lang) {
  const algo = world.algorithmName ?? "A*";
  if (world.presentationMode === "vehicle_race") {
    if (world.raceWinner) return lang === "vi" ? `${algo} tới đích trước. Đồng hồ đã dừng.` : `${algo} finishes first. Timer stopped.`;
    if (world.raceFinished) return lang === "vi" ? `${algo} đã tới điểm ra. Đồng hồ đã dừng.` : `${algo} reached the exit. Timer stopped.`;
    return lang === "vi" ? `${algo} chỉ chạy sang ô lân cận không bị tường chắn.` : `${algo} moves only to adjacent unblocked cells.`;
  }
  if (world.phase === "obstacle") return lang === "vi" ? "Tường mới xuất hiện, đường cũ bị phá." : "New walls appear and break the old route.";
  if (world.phase === "done") return lang === "vi" ? `${algo} đã tìm thấy lối ra.` : `${algo} reached the exit.`;
  if (world.phase === "replan") return lang === "vi" ? `${algo} đang tính lại đường đi.` : `${algo} is replanning.`;
  return lang === "vi" ? `${algo} mở rộng mê cung từ lối vào.` : `${algo} expands the maze from the entrance.`;
}

function formatRaceTime(value: number) {
  return `${Math.max(0, value).toString().padStart(2, "0")} tick`;
}

function raceResult(world: AlgorithmWorldState, lang: Lang) {
  if (world.raceWinner) return "WIN";
  if (world.raceFinished) return lang === "vi" ? "Về đích" : "Done";
  return lang === "vi" ? "Đang chạy" : "Running";
}