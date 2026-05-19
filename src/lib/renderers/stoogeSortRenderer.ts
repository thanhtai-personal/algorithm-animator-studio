import type { Frame } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawStoogeSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const n = frame.arr.length;
  if (!n) return;

  const lo = numberVar(frame, "lo") ?? 0;
  const hi = numberVar(frame, "hi") ?? n - 1;
  const third = numberVar(frame, "third") ?? Math.floor((hi - lo + 1) / 3);
  const depth = numberVar(frame, "depth") ?? 0;
  const stripY = y + h * 0.48;
  const stripH = Math.max(24, h * 0.22);

  drawCells(ctx, frame, x, stripY, w, stripH, lo, hi, theme);
  drawRangeBand(ctx, x, stripY - 18, w, n, lo, hi, theme.pivot, "current");
  if (hi - lo + 1 > 2) {
    drawRangeBand(ctx, x, stripY - 40, w, n, lo, hi - third, theme.highlight, "left 2/3");
    drawRangeBand(ctx, x, stripY + stripH + 18, w, n, lo + third, hi, theme.swap, "right 2/3");
  }

  const phase = String(frame.vars.phase ?? "compare ends");
  const text = `depth=${depth}  range=[${lo}..${hi}]  ${phase}`;
  drawSmallText(ctx, text, x + 4, y + 14, phase.includes("swap") ? theme.swap : theme.highlight, "left");
  drawSmallText(ctx, "Stooge recursion: left 2/3 -> right 2/3 -> left 2/3 again", x + w - 4, y + h - 10, "rgba(226,232,240,0.78)", "right");
}

function drawCells(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, lo: number, hi: number, theme: Theme) {
  const n = frame.arr.length;
  const gap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const cx = x + i * (cellW + gap);
    const inRange = i >= lo && i <= hi;
    const activeEnd = i === lo || i === hi;
    ctx.fillStyle = frame.swap.includes(i)
      ? theme.swap
      : activeEnd
        ? theme.highlight
        : inRange
          ? "rgba(148,163,184,0.7)"
          : "rgba(71,85,105,0.42)";
    roundRect(ctx, cx, y, cellW, h, Math.min(8, cellW / 2));
    ctx.fill();
    ctx.fillStyle = activeEnd || frame.swap.includes(i) ? "#0f172a" : "rgba(15,23,42,0.82)";
    ctx.font = `800 ${Math.max(9, Math.min(15, cellW * 0.4))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i), cx + cellW / 2, y + h / 2);
  }
}

function drawRangeBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, n: number, lo: number, hi: number, color: string, label: string) {
  if (lo < 0 || hi < lo || n <= 0) return;
  const gap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = (w - gap * (n - 1)) / n;
  const bx = x + lo * (cellW + gap);
  const bw = (hi - lo + 1) * cellW + (hi - lo) * gap;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(bx, y);
  ctx.lineTo(bx + bw, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "800 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, bx + bw / 2, y - 5);
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
