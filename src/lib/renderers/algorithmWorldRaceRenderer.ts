import type { AlgorithmWorldCell, AlgorithmWorldState } from "../algorithms";
import type { Lang } from "../i18n";
import type { Theme } from "./theme";
import { roundRect } from "./shapes";

export function drawRaceTrackBase(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  const w = cell * cols;
  const h = cell * rows;
  const lip = Math.max(12, cell * 0.42);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  roundRect(ctx, x - lip + 10, y - lip + 14, w + lip * 2, h + lip * 2, 16);
  ctx.fill();

  const curb = ctx.createLinearGradient(x - lip, y - lip, x + w + lip, y + h + lip);
  curb.addColorStop(0, "#7f1d1d");
  curb.addColorStop(0.5, "#ef4444");
  curb.addColorStop(1, "#111827");
  ctx.fillStyle = curb;
  roundRect(ctx, x - lip, y - lip, w + lip * 2, h + lip * 2, 16);
  ctx.fill();

  const road = ctx.createLinearGradient(x, y, x, y + h);
  road.addColorStop(0, "#2b3442");
  road.addColorStop(0.45, "#171717");
  road.addColorStop(1, "#111827");
  ctx.fillStyle = road;
  roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 8);
  ctx.fill();

  drawAsphaltTexture(ctx, cols, rows, cell, x, y);
  drawLaneGrid(ctx, cols, rows, cell, x, y);
  drawCheckeredGate(ctx, rows, cell, x - lip * 0.45, y, true);
  drawCheckeredGate(ctx, rows, cell, x + w + lip * 0.12, y, false);
  ctx.restore();
}

function drawAsphaltTexture(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tint = (col * 17 + row * 29) % 3;
      ctx.fillStyle = tint === 0 ? "#ffffff" : tint === 1 ? "#64748b" : "#000000";
      ctx.fillRect(x + col * cell + cell * 0.18, y + row * cell + cell * 0.22, Math.max(1, cell * 0.08), Math.max(1, cell * 0.08));
    }
  }
  ctx.restore();
}

function drawLaneGrid(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  const w = cols * cell;
  const h = rows * cell;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= cols; col++) {
    ctx.beginPath(); ctx.moveTo(x + col * cell, y); ctx.lineTo(x + col * cell, y + h); ctx.stroke();
  }
  for (let row = 0; row <= rows; row++) {
    ctx.beginPath(); ctx.moveTo(x, y + row * cell); ctx.lineTo(x + w, y + row * cell); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(253,224,71,0.28)";
  ctx.setLineDash([cell * 0.45, cell * 0.35]);
  ctx.lineWidth = Math.max(1.2, cell * 0.04);
  for (let row = 2; row < rows; row += 4) {
    ctx.beginPath(); ctx.moveTo(x, y + row * cell); ctx.lineTo(x + w, y + row * cell); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCheckeredGate(ctx: CanvasRenderingContext2D, rows: number, cell: number, x: number, y: number, start: boolean) {
  const gateW = Math.max(8, cell * 0.34);
  for (let row = 0; row < rows; row++) {
    ctx.fillStyle = row % 2 === 0 ? "#f8fafc" : "#020617";
    ctx.fillRect(x, y + row * cell, gateW, cell / 2);
    ctx.fillStyle = row % 2 === 0 ? "#020617" : "#f8fafc";
    ctx.fillRect(x, y + row * cell + cell / 2, gateW, cell / 2);
  }
  ctx.fillStyle = start ? "#22d3ee" : "#fb7185";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x - 2, y - 3, gateW + 4, 3);
  ctx.fillRect(x - 2, y + rows * cell, gateW + 4, 3);
  ctx.globalAlpha = 1;
}

export function drawRaceWalls(ctx: CanvasRenderingContext2D, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  ctx.save();
  const lift = Math.max(5, cell * 0.24);
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    ctx.fillStyle = dynamic ? "#7c2d12" : "#1f2937";
    roundRect(ctx, px + 4, py + lift + 4, cell - 2, cell - lift, Math.max(3, cell * 0.12));
    ctx.fill();
    const grad = ctx.createLinearGradient(px, py, px, py + cell);
    grad.addColorStop(0, dynamic ? "#fdba74" : "#f8fafc");
    grad.addColorStop(0.5, dynamic ? "#f97316" : "#cbd5e1");
    grad.addColorStop(1, dynamic ? "#c2410c" : "#94a3b8");
    ctx.fillStyle = grad;
    roundRect(ctx, px, py, cell - 2, cell - lift, Math.max(3, cell * 0.12));
    ctx.fill();
    ctx.strokeStyle = dynamic ? "#fed7aa" : "#ef4444";
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.stroke();
    ctx.fillStyle = dynamic ? "rgba(124,45,18,0.28)" : "rgba(239,68,68,0.18)";
    ctx.fillRect(px + 3, py + cell * 0.32, cell - 8, Math.max(2, cell * 0.08));
  });
  ctx.restore();
}

export function drawRaceWinner(ctx: CanvasRenderingContext2D, world: AlgorithmWorldState, cx: number, cy: number, w: number, theme: Theme, lang: Lang) {
  const age = world.raceWinAge ?? 0;
  const pop = age < 10 ? 0.72 + age * 0.04 : 1 + Math.sin(age * 0.45) * 0.035;
  const alpha = Math.min(1, 0.28 + age * 0.12);
  const boxW = Math.min(w * 0.92, 720) * pop;
  const boxH = 112 * pop;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2,6,23,0.9)";
  ctx.strokeStyle = age < 10 ? "#fde047" : `${theme.highlight}cc`;
  ctx.lineWidth = Math.max(3, 4 * pop);
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 26 + Math.sin(age * 0.5) * 10;
  roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fde047";
  ctx.font = `900 ${Math.round(50 * pop)}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${world.algorithmName ?? "Algorithm"} WINNER`, cx, cy - 14 * pop);
  ctx.fillStyle = "#fff";
  ctx.font = `900 ${Math.round(22 * pop)}px ui-sans-serif, system-ui`;
  ctx.fillText(lang === "vi" ? "Xe thắng đã dừng tại cửa ra" : "Winning car stopped at the exit", cx, cy + 30 * pop);
  ctx.restore();
}
