import type { Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawBogoSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, lang: Lang) {
  const phase = String(frame.vars.phase ?? "shuffle");
  const isShuffle = phase.includes("shuffle");
  const stripY = y + h * 0.34;
  const stripH = h * 0.36;
  drawCells(ctx, frame, x, stripY, w, stripH, theme, isShuffle);

  const caption = lang === "vi"
    ? `attempt=${frame.vars.attempt ?? 0}  ${isShuffle ? "xáo lại toàn bộ" : "kiểm tra đã sorted chưa"}`
    : `attempt=${frame.vars.attempt ?? 0}  ${isShuffle ? "shuffle everything again" : "check if sorted yet"}`;
  drawSmallText(ctx, caption, x + 4, y + 16, isShuffle ? theme.swap : theme.highlight, "left");
  drawSmallText(
    ctx,
    lang === "vi" ? "Chỉ nên dùng mảng nhỏ: số lần thử tăng rất nhanh" : "Tiny arrays only: attempts can explode fast",
    x + w - 4,
    y + h - 12,
    "rgba(226,232,240,0.78)",
    "right",
  );
}

function drawCells(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, isShuffle: boolean) {
  const n = frame.arr.length;
  if (!n) return;
  const gap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const cx = x + i * (cellW + gap);
    ctx.fillStyle = frame.sorted.includes(i)
      ? theme.sorted
      : frame.highlight.includes(i)
        ? theme.highlight
        : frame.swap.includes(i)
          ? theme.swap
          : isShuffle
            ? "rgba(244,114,182,0.62)"
            : "rgba(148,163,184,0.55)";
    roundRect(ctx, cx, y, cellW, h, Math.min(8, cellW / 2));
    ctx.fill();
    if (n <= 32) {
      ctx.fillStyle = "#0f172a";
      ctx.font = `800 ${Math.max(9, Math.min(16, cellW * 0.36))}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i), cx + cellW / 2, y + h / 2);
    }
  }
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
