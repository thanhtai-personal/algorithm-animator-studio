import type { Frame } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

type Cell = { x: number; y: number; w: number; h: number; cx: number };

export function drawCycleSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const n = frame.arr.length;
  if (!n) return;

  const cycleStart = clampIndex(numberVar(frame, "cycleStart") ?? 0, n);
  const pos = clampIndex(numberVar(frame, "pos") ?? cycleStart, n);
  const i = numberVar(frame, "i");
  const phase = String(frame.vars.phase ?? "count");
  const item = frame.vars.writeValue ?? frame.vars.item ?? "-";
  const cells = layoutCells(x, y + h * 0.44, w, Math.max(24, h * 0.24), n);

  drawCells(ctx, frame, cells, cycleStart, pos, i, theme);
  drawCycleArrow(ctx, cells[cycleStart], cells[pos], theme.swap);
  drawItemBadge(ctx, x + 4, y + 14, `item=${item}`, phase === "write" ? theme.swap : theme.highlight);
  drawSmallText(ctx, summaryText(phase, cycleStart, pos), x + w - 4, y + 14, theme.highlight, "right");
  drawSmallText(ctx, "count smaller values -> final position; write once per cycle slot", x + w - 4, y + h - 10, "rgba(226,232,240,0.78)", "right");
}

function layoutCells(x: number, y: number, w: number, h: number, n: number) {
  const gap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = (w - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, index) => {
    const cellX = x + index * (cellW + gap);
    return { x: cellX, y, w: cellW, h, cx: cellX + cellW / 2 };
  });
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  cells: Cell[],
  cycleStart: number,
  pos: number,
  i: number | undefined,
  theme: Theme,
) {
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    const isStart = index === cycleStart;
    const isPos = index === pos;
    const isScan = index === i;
    const isWritten = frame.sorted.includes(index);
    ctx.fillStyle = isPos ? theme.swap : isStart ? theme.pivot : isScan ? theme.highlight : isWritten ? theme.sorted : "rgba(148,163,184,0.62)";
    roundRect(ctx, cell.x, cell.y, cell.w, cell.h, Math.min(8, cell.w / 2));
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = `800 ${Math.max(9, Math.min(15, cell.w * 0.36))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(frame.arr[index]), cell.cx, cell.y + cell.h / 2);
  }
  labelCell(ctx, cells[cycleStart], "start", theme.pivot, -12);
  labelCell(ctx, cells[pos], "pos", theme.swap, 42);
}

function drawCycleArrow(ctx: CanvasRenderingContext2D, from: Cell | undefined, to: Cell | undefined, color: string) {
  if (!from || !to || from === to) return;
  const y = from.y - 8;
  const mid = (from.cx + to.cx) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.cx, y);
  ctx.quadraticCurveTo(mid, y - Math.min(42, Math.abs(to.cx - from.cx) * 0.25 + 16), to.cx, y);
  ctx.stroke();
  const dir = to.cx >= from.cx ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(to.cx, y);
  ctx.lineTo(to.cx - 10 * dir, y - 6);
  ctx.lineTo(to.cx - 10 * dir, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawItemBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.92)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y - 13, 112, 26, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "800 13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 56, y);
  ctx.restore();
}

function labelCell(ctx: CanvasRenderingContext2D, cell: Cell | undefined, text: string, color: string, offsetY: number) {
  if (!cell) return;
  drawSmallText(ctx, text, cell.cx, cell.y + offsetY, color, "center");
}

function summaryText(phase: string, cycleStart: number, pos: number) {
  if (phase === "write") return `write into ${pos}, carry displaced item`;
  if (phase === "skip duplicate") return `skip duplicate slot at ${pos}`;
  if (phase === "recount") return `recount carried item from ${cycleStart}`;
  return `count smaller values: start ${cycleStart} -> pos ${pos}`;
}

function drawSmallText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 14px ui-monospace, monospace";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function numberVar(frame: Frame, key: string) {
  const value = frame.vars[key];
  return typeof value === "number" ? value : undefined;
}

function clampIndex(value: number, length: number) {
  return Math.max(0, Math.min(length - 1, Math.floor(value)));
}
