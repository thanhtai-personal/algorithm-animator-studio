import type { Frame } from "../algorithms";
import type { Theme } from "./theme";

export function drawBitonicLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const n = frame.arr.length;
  if (!n) return;

  const lo = clampIndex(numberVar(frame, "lo") ?? 0, n);
  const rawCount = numberVar(frame, "count") ?? n;
  const count = Math.max(1, Math.min(rawCount, n - lo));
  const end = lo + count - 1;
  const mid = clampIndex(numberVar(frame, "mid") ?? lo + Math.floor(count / 2), n);
  const gap = numberVar(frame, "gap") ?? Math.max(1, Math.floor(count / 2));
  const i = clampIndex(numberVar(frame, "i") ?? frame.highlight[0] ?? frame.swap[0] ?? lo, n);
  const j = clampIndex(numberVar(frame, "j") ?? frame.highlight[1] ?? frame.swap[1] ?? Math.min(i + gap, end), n);
  const dir = String(frame.vars.dir ?? "asc");
  const stage = String(frame.vars.stage ?? "split");
  const stripY = y + h * 0.48;
  const stripH = Math.max(24, h * 0.22);
  const cells = layoutCells(x, stripY, w, stripH, n);

  drawRangeBand(ctx, cells, lo, end, stage === "merge" ? theme.pivot : theme.highlight);
  if (stage === "split") drawSplitDirections(ctx, cells, lo, mid, end, theme);
  drawCells(ctx, frame, cells, lo, end, theme);

  if (stage === "merge" && i !== j) {
    drawCompareArc(ctx, cells[i], cells[j], dir === "desc" ? theme.swap : theme.highlight, h);
  }

  const summary = stage === "split"
    ? `split range [${lo}..${end}] -> left asc, right desc`
    : `merge ${dir}  gap=${gap}  compare ${i}<->${j}`;
  drawSmallText(ctx, summary, x + 4, y + 14, stage === "merge" ? theme.pivot : theme.highlight, "left");
  drawSmallText(ctx, "bitonic = one half rises, the other falls; merge shrinks the gap", x + w - 4, y + h - 10, "rgba(226,232,240,0.78)", "right");
}

type Cell = { x: number; y: number; w: number; h: number; cx: number };

function layoutCells(x: number, y: number, w: number, h: number, n: number) {
  const gap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = (w - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, index) => {
    const cellX = x + index * (cellW + gap);
    return { x: cellX, y, w: cellW, h, cx: cellX + cellW / 2 };
  });
}

function drawRangeBand(ctx: CanvasRenderingContext2D, cells: Cell[], lo: number, end: number, color: string) {
  const first = cells[lo], last = cells[end];
  if (!first || !last) return;
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.7)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, first.x - 7, first.y - 13, last.x + last.w - first.x + 14, first.h + 26, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSplitDirections(ctx: CanvasRenderingContext2D, cells: Cell[], lo: number, mid: number, end: number, theme: Theme) {
  drawDirection(ctx, cells[lo]?.cx, cells[Math.max(lo, mid - 1)]?.cx, cells[lo]?.y - 22, theme.highlight, "ASC");
  drawDirection(ctx, cells[mid]?.cx, cells[end]?.cx, cells[mid]?.y - 22, theme.swap, "DESC", -1);
}

function drawDirection(ctx: CanvasRenderingContext2D, from: number | undefined, to: number | undefined, y: number | undefined, color: string, label: string, sign: 1 | -1 = 1) {
  if (from == null || to == null || y == null) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(from, y);
  ctx.lineTo(to, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to, y);
  ctx.lineTo(to - 9 * sign, y - 6);
  ctx.lineTo(to - 9 * sign, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.font = "800 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, (from + to) / 2, y - 8);
  ctx.restore();
}

function drawCells(ctx: CanvasRenderingContext2D, frame: Frame, cells: Cell[], lo: number, end: number, theme: Theme) {
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    const active = frame.highlight.includes(index) || frame.swap.includes(index);
    const inRange = index >= lo && index <= end;
    ctx.fillStyle = active ? theme.swap : inRange ? "rgba(148,163,184,0.72)" : "rgba(71,85,105,0.42)";
    roundRect(ctx, cell.x, cell.y, cell.w, cell.h, Math.min(8, cell.w / 2));
    ctx.fill();
    if (cells.length <= 32) {
      ctx.fillStyle = active ? "#fff" : "#0f172a";
      ctx.font = `800 ${Math.max(9, Math.min(15, cell.w * 0.36))}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index), cell.cx, cell.y + cell.h / 2);
    }
  }
}

function drawCompareArc(ctx: CanvasRenderingContext2D, a: Cell | undefined, b: Cell | undefined, color: string, h: number) {
  if (!a || !b) return;
  const y = a.y - 6;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(a.cx, y);
  ctx.quadraticCurveTo((a.cx + b.cx) / 2, y - Math.min(40, Math.abs(b.cx - a.cx) * 0.18 + h * 0.08), b.cx, y);
  ctx.stroke();
  ctx.restore();
}

function drawSmallText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 15px ui-monospace, monospace";
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
