import type { Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawBogoSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, lang: Lang) {
  const phase = String(frame.vars.phase ?? "shuffle");
  const attempt = frame.vars.attempt ?? 0;
  const chance = String(frame.vars.chance ?? `1/${factorial(frame.arr.length)}`);
  const isShuffle = phase.includes("shuffle");
  const isCheck = phase.includes("check");
  const isFailed = phase.includes("failed");
  const isDone = phase.includes("done");

  drawPhaseRail(ctx, x, y + 2, w, 34, theme, lang, isShuffle, isCheck, isFailed || isDone);
  drawChaosArena(ctx, frame, x, y + 48, w, Math.max(64, h - 104), theme, isShuffle);
  drawChanceBadge(ctx, x, y + h - 44, Math.min(184, w * 0.4), 32, chance, theme, lang);
  drawNoStrategyNote(ctx, x + Math.min(196, w * 0.44), y + h - 44, w - Math.min(208, w * 0.48), 32, theme, lang, isFailed, isDone);

  const caption = isShuffle
    ? label(lang, `attempt ${attempt}: xáo bằng các swap ngẫu nhiên`, `attempt ${attempt}: random swap shuffle`)
    : isCheck
      ? label(lang, `attempt ${attempt}: quét từng cặp để xem đã may mắn chưa`, `attempt ${attempt}: scan pairs to see if luck worked`)
      : isFailed
        ? label(lang, "gặp 1 inversion là bỏ công, quay lại shuffle", "one inversion wastes the attempt, shuffle again")
        : label(lang, "không có chiến lược — chỉ thắng nhờ may mắn", "no strategy — it wins only by luck");

  drawSmallText(ctx, caption, x + 4, y + 16, isShuffle ? theme.swap : isFailed ? "#fb7185" : theme.highlight, "left");
}

function drawPhaseRail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang,
  shuffleActive: boolean,
  checkActive: boolean,
  repeatActive: boolean,
) {
  const labels = [
    label(lang, "1. XÁO", "1. SHUFFLE"),
    label(lang, "2. KIỂM TRA", "2. CHECK"),
    label(lang, "3. LẶP LẠI", "3. REPEAT"),
  ];
  const active = [shuffleActive, checkActive, repeatActive];
  const gap = 8;
  const chipW = (w - gap * 2) / 3;

  for (let i = 0; i < labels.length; i++) {
    const cx = x + i * (chipW + gap);
    ctx.fillStyle = active[i] ? (i === 0 ? theme.swap : i === 1 ? theme.highlight : "#fb7185") : "rgba(15,23,42,0.72)";
    roundRect(ctx, cx, y, chipW, h, 12);
    ctx.fill();
    ctx.fillStyle = active[i] ? "#0f172a" : "rgba(226,232,240,0.74)";
    ctx.font = `800 ${Math.max(10, Math.min(14, chipW * 0.09))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[i], cx + chipW / 2, y + h / 2);
  }
}

function drawChaosArena(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, isShuffle: boolean) {
  const n = frame.arr.length;
  if (!n) return;

  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.58)";
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();

  const cellGap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = Math.max(3, (w - cellGap * (n - 1) - 18) / n);
  const cellH = Math.min(42, h * 0.34);
  const stripX = x + 9;
  const stripY = y + h * 0.52 - cellH / 2;
  const cells = frame.arr.map((value, index) => ({
    value,
    index,
    cx: stripX + index * (cellW + cellGap),
    cy: stripY,
  }));

  drawNoInvariantWave(ctx, x + 12, y + 18, w - 24, theme.swap, isShuffle);

  if (frame.swap.length === 2) {
    const [left, right] = frame.swap;
    const a = cells[left];
    const b = cells[right];
    if (a && b) drawSwapArc(ctx, a.cx + cellW / 2, b.cx + cellW / 2, stripY - 10, Math.max(28, h * 0.22), theme.swap);
  }

  for (const cell of cells) {
    const activeSwap = frame.swap.includes(cell.index);
    const activeCheck = frame.highlight.includes(cell.index);
    const color = frame.sorted.includes(cell.index)
      ? theme.sorted
      : activeSwap
        ? theme.swap
        : activeCheck
          ? theme.highlight
          : isShuffle
            ? "rgba(244,114,182,0.56)"
            : "rgba(148,163,184,0.55)";
    ctx.fillStyle = color;
    roundRect(ctx, cell.cx, cell.cy, cellW, cellH, Math.min(10, cellW / 2));
    ctx.fill();
    ctx.fillStyle = activeSwap || activeCheck || frame.sorted.includes(cell.index) ? "#0f172a" : "rgba(15,23,42,0.84)";
    ctx.font = `800 ${Math.max(10, Math.min(17, cellW * 0.42))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(cell.value), cell.cx + cellW / 2, cell.cy + cellH / 2);
  }

  drawDifferenceLabels(ctx, x + 12, y + h - 22, w - 24, theme, isShuffle);
  ctx.restore();
}

function drawNoInvariantWave(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string, active: boolean) {
  ctx.save();
  ctx.strokeStyle = active ? color : "rgba(148,163,184,0.26)";
  ctx.lineWidth = active ? 3 : 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  const segments = 28;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = x + t * w;
    const py = y + Math.sin(t * Math.PI * 6) * 5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSwapArc(ctx: CanvasRenderingContext2D, ax: number, bx: number, y: number, lift: number, color: string) {
  const mid = (ax + bx) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ax, y);
  ctx.quadraticCurveTo(mid, y - lift, bx, y);
  ctx.stroke();
  ctx.restore();
}

function drawDifferenceLabels(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, theme: Theme, active: boolean) {
  const labels = ["no pivot", "no gap", "no invariant"];
  const gap = 6;
  const chipW = Math.min(104, (w - gap * 2) / 3);
  ctx.font = "700 11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < labels.length; i++) {
    const cx = x + i * (chipW + gap);
    ctx.fillStyle = active ? "rgba(244,114,182,0.18)" : "rgba(148,163,184,0.14)";
    roundRect(ctx, cx, y - 13, chipW, 26, 13);
    ctx.fill();
    ctx.fillStyle = i === 2 ? theme.swap : "rgba(226,232,240,0.82)";
    ctx.fillText(labels[i], cx + chipW / 2, y);
  }
}

function drawChanceBadge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, chance: string, theme: Theme, lang: Lang) {
  ctx.fillStyle = "rgba(250,204,21,0.14)";
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  drawSmallText(ctx, label(lang, `cơ hội: ${chance}`, `chance: ${chance}`), x + w / 2, y + h / 2, theme.highlight, "center");
}

function drawNoStrategyNote(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: Theme, lang: Lang, failed: boolean, done: boolean) {
  if (w <= 40) return;
  ctx.fillStyle = failed ? "rgba(248,113,113,0.16)" : done ? "rgba(34,197,94,0.16)" : "rgba(148,163,184,0.14)";
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  const text = done
    ? label(lang, "may mắn trúng", "lucky hit")
    : failed
      ? label(lang, "sai 1 cặp = làm lại", "1 bad pair = reset")
      : label(lang, "không tiến trình chắc chắn", "no guaranteed progress");
  drawSmallText(ctx, text, x + w / 2, y + h / 2, done ? theme.sorted : failed ? "#fb7185" : "rgba(226,232,240,0.8)", "center");
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

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}

function factorial(length: number) {
  const n = Math.max(1, length);
  if (n > 7) return `${n}!`;
  let value = 1;
  for (let i = 2; i <= n; i++) value *= i;
  return String(value);
}
