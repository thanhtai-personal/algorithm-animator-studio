import type { Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { drawBucketContents } from "./bucketContentsRenderer";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawFlashSortLens(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang,
  previousFrame?: Frame | null,
  transitionProgress = 1,
) {
  const phase = String(frame.vars.phase ?? "classify");
  const min = valueLabel(frame.vars.min);
  const max = valueLabel(frame.vars.max);
  const activeClass = numberVar(frame, "class") ?? frame.buckets?.activeBucket;
  const classCount = Number(frame.vars.m ?? frame.buckets?.labels.length ?? 0);
  const topY = y + 8;
  const railY = y + 36;
  const bucketY = y + 64;
  const bucketH = Math.max(44, h - 94);

  drawFormula(ctx, x, topY, w, phase, min, max, theme, lang);
  drawClassRail(ctx, x, railY, w, 20, classCount, activeClass, theme);

  if (frame.buckets) {
    drawBucketContents(
      ctx,
      frame.buckets.labels,
      frame.buckets.buckets,
      x,
      bucketY,
      w,
      bucketH,
      theme,
      activeClass,
      previousFrame?.buckets?.buckets,
      transitionProgress,
    );
  } else {
    drawZoneFallback(ctx, frame, x, bucketY, w, bucketH, theme, activeClass);
  }

  drawSmallText(ctx, captionFor(phase, lang), x + 4, y + h - 12, phaseColor(phase, theme), "left");
}

function drawFormula(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  phase: string,
  min: string,
  max: string,
  theme: Theme,
  lang: Lang,
) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.78)";
  ctx.strokeStyle = phaseColor(phase, theme);
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y - 12, w, 26, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "800 13px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const label = lang === "vi"
    ? `ước lượng class từ khoảng min=${min} → max=${max}`
    : `estimate class from range min=${min} → max=${max}`;
  ctx.fillText(label, x + 12, y + 1);
  ctx.fillStyle = theme.highlight;
  ctx.textAlign = "right";
  ctx.fillText("k = floor((m-1)*(x-min)/(max-min))", x + w - 12, y + 1);
  ctx.restore();
}

function drawClassRail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  classCount: number,
  activeClass: number | undefined,
  theme: Theme,
) {
  if (!classCount) return;
  const gap = Math.max(3, Math.min(8, w / classCount * 0.08));
  const cellW = (w - gap * (classCount - 1)) / classCount;
  ctx.save();
  for (let i = 0; i < classCount; i++) {
    const cx = x + i * (cellW + gap);
    const active = activeClass === i;
    ctx.fillStyle = active ? "rgba(250,204,21,0.95)" : "rgba(148,163,184,0.42)";
    roundRect(ctx, cx, y, cellW, h, 7);
    ctx.fill();
    ctx.fillStyle = active ? "#0f172a" : "#cbd5e1";
    ctx.font = `800 ${Math.max(9, Math.min(12, cellW * 0.34))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`C${i}`, cx + cellW / 2, y + h / 2);
  }
  ctx.restore();
  void theme;
}

function drawZoneFallback(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, activeClass?: number) {
  const count = Math.max(2, Number(frame.vars.m ?? 2));
  const gap = Math.max(4, Math.min(10, w / count * 0.1));
  const cellW = (w - gap * (count - 1)) / count;
  for (let i = 0; i < count; i++) {
    const cx = x + i * (cellW + gap);
    const active = activeClass === i;
    ctx.fillStyle = active ? "rgba(250,204,21,0.2)" : "rgba(30,41,59,0.76)";
    ctx.strokeStyle = active ? theme.highlight : "rgba(148,163,184,0.32)";
    ctx.lineWidth = active ? 3 : 1.5;
    roundRect(ctx, cx, y, cellW, h, 12);
    ctx.fill();
    ctx.stroke();
    drawSmallText(ctx, `C${i}`, cx + cellW / 2, y + h / 2, active ? theme.highlight : "#cbd5e1", "center");
  }
}

function captionFor(phase: string, lang: Lang) {
  if (phase.includes("find")) return lang === "vi" ? "bước 1: tìm min/max để dựng thước phân lớp" : "step 1: find min/max to build the class scale";
  if (phase.includes("classify")) return lang === "vi" ? "bước 2: đưa giá trị vào class ước lượng" : "step 2: route each value to an estimated class";
  if (phase.includes("prefix")) return lang === "vi" ? "bước 3: prefix sum biến count thành biên class" : "step 3: prefix sums turn counts into class boundaries";
  if (phase.includes("flash")) return lang === "vi" ? "bước 4: flash giá trị vào vùng gần đúng bằng swap" : "step 4: flash values into approximate zones with swaps";
  if (phase.includes("cleanup")) return lang === "vi" ? "bước 5: insertion sort dọn lỗi nhỏ còn lại" : "step 5: insertion sort cleans up local disorder";
  return lang === "vi" ? "Flash Sort = phân lớp gần đúng trước, sort sau" : "Flash Sort = approximate classes first, cleanup second";
}

function phaseColor(phase: string, theme: Theme) {
  if (phase.includes("flash")) return theme.swap;
  if (phase.includes("cleanup")) return theme.sorted;
  return theme.highlight;
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

function valueLabel(value: unknown) {
  return value == null ? "-" : String(value);
}
