import type { Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawPancakeSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, lang: Lang) {
  const size = Number(frame.vars.size ?? frame.arr.length);
  const max = Number(frame.vars.max ?? -1);
  const to = Number(frame.vars.to ?? Math.max(0, size - 1));
  const phase = String(frame.vars.phase ?? "scan max");
  const stripY = y + h * 0.36;
  const stripH = h * 0.36;
  const cells = layoutCells(frame.arr.length, x, stripY, w, stripH);

  ctx.save();
  cells.forEach((cell, index) => {
    const inPrefix = index < size;
    const isFlip = frame.swap.includes(index);
    const color = frame.sorted.includes(index)
      ? theme.sorted
      : isFlip
        ? theme.swap
        : index === max
          ? theme.pivot
          : inPrefix
            ? "rgba(56,189,248,0.68)"
            : "rgba(148,163,184,0.25)";
    ctx.fillStyle = color;
    roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 8);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 ${Math.max(10, Math.min(15, cell.w * 0.36))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(frame.arr[index]), cell.x + cell.w / 2, cell.y + cell.h / 2);
  });

  if (size > 0) {
    drawRange(ctx, cells[0], cells[Math.max(0, size - 1)], y + 12, theme.highlight, `prefix 0-${size - 1}`);
  }
  if (frame.event === "swap") {
    drawRange(ctx, cells[0], cells[Math.max(0, Math.min(to, cells.length - 1))], y + h - 18, theme.swap, `flip 0-${to}`);
  }

  const summary = phase.includes("top")
    ? label(lang, "đưa max lên đầu prefix", "move max to prefix front")
    : phase.includes("sorted")
      ? label(lang, "đưa max về cuối prefix", "move max to prefix end")
      : label(lang, "scan prefix để tìm max", "scan prefix to find max");
  drawSmallText(ctx, `${summary} · max=${max >= 0 ? frame.arr[max] ?? "-" : "-"}`, x + 4, y + 18, theme.highlight, "left");
  ctx.restore();
}

type Cell = { x: number; y: number; w: number; h: number };

function layoutCells(count: number, x: number, y: number, w: number, h: number): Cell[] {
  const gap = Math.max(2, Math.min(8, w / Math.max(1, count) * 0.12));
  const cellW = (w - gap * Math.max(0, count - 1)) / Math.max(1, count);
  return Array.from({ length: count }, (_, index) => ({ x: x + index * (cellW + gap), y, w: cellW, h }));
}

function drawRange(ctx: CanvasRenderingContext2D, from: Cell | undefined, to: Cell | undefined, y: number, color: string, text: string) {
  if (!from || !to) return;
  const left = from.x;
  const right = to.x + to.w;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(right, y);
  ctx.lineTo(right - 11, y - 7);
  ctx.lineTo(right - 11, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.font = "800 14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, (left + right) / 2, y - 5);
}

function drawSmallText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign) {
  ctx.fillStyle = color;
  ctx.font = "800 15px ui-sans-serif, system-ui";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}
