import type { AlgorithmWorldCell } from "../algorithms";
import { roundRect } from "./shapes";

export function drawRaceTrackBase(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number, x: number, y: number) {
  ctx.save();
  const w = cell * cols;
  const h = cell * rows;
  const lip = Math.max(10, cell * 0.34);
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  roundRect(ctx, x - lip + 8, y - lip + 12, w + lip * 2, h + lip * 2, 12);
  ctx.fill();
  ctx.fillStyle = "#111827";
  roundRect(ctx, x - lip, y - lip, w + lip * 2, h + lip * 2, 12);
  ctx.fill();
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = Math.max(2, cell * 0.1);
  ctx.stroke();
  ctx.fillStyle = "#171717";
  roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(239,68,68,0.72)";
  ctx.lineWidth = Math.max(1.5, cell * 0.06);
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= cols; col++) {
    ctx.beginPath();
    ctx.moveTo(x + col * cell, y);
    ctx.lineTo(x + col * cell, y + h);
    ctx.stroke();
  }
  for (let row = 0; row <= rows; row++) {
    ctx.beginPath();
    ctx.moveTo(x, y + row * cell);
    ctx.lineTo(x + w, y + row * cell);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRaceWalls(ctx: CanvasRenderingContext2D, cells: AlgorithmWorldCell[], cell: number, x: number, y: number, dynamic: boolean) {
  ctx.save();
  const lift = Math.max(5, cell * 0.22);
  cells.forEach((c) => {
    const px = x + c.x * cell + 1;
    const py = y + c.y * cell + 1;
    ctx.fillStyle = dynamic ? "#7f1d1d" : "#374151";
    roundRect(ctx, px + 3, py + lift + 3, cell - 2, cell - lift, Math.max(2, cell * 0.1));
    ctx.fill();
    ctx.fillStyle = dynamic ? "#f97316" : "#e5e7eb";
    roundRect(ctx, px, py, cell - 2, cell - lift, Math.max(2, cell * 0.1));
    ctx.fill();
    ctx.strokeStyle = dynamic ? "#fb923c" : "#ef4444";
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.stroke();
    ctx.fillStyle = dynamic ? "rgba(254,215,170,0.42)" : "rgba(255,255,255,0.36)";
    ctx.fillRect(px + 3, py + 3, cell - 8, Math.max(2, lift * 0.36));
  });
  ctx.restore();
}
