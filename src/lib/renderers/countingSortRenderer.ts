import type { Frame } from "../algorithms";
import type { Theme } from "./theme";

type Bar = { x: number; y: number; w: number; h: number; cx: number; top: number; value: number };

export function drawCountingSort(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
) {
  const state = frame.counting;
  if (!state) return;

  const gap = Math.max(12, h * 0.04);
  const topH = h * 0.48;
  const bottomH = h - topH - gap;
  const topY = y;
  const bottomY = y + topH + gap;
  const outputValues = state.phase === "write" || state.phase === "done" ? frame.arr : state.source;

  drawSection(ctx, x, topY, w, topH, state.phase === "write" ? "Old chart: sorted output" : "Old chart: original values");
  drawSection(ctx, x, bottomY, w, bottomH, state.phase === "sort" ? "New chart: unique values sorted" : "New chart: unique values + counts");

  const outputBars = drawValueChart(ctx, outputValues, x + 18, topY + 42, w - 36, topH - 58, {
    theme,
    activeIndex: state.phase === "collect" ? state.activeSourceIndex : state.activeOutputIndex,
    sorted: frame.sorted,
    dimAfter: state.phase === "write" ? frame.sorted.length : undefined,
  });
  const uniqueBars = drawUniqueChart(ctx, state.uniqueValues, state.counts, x + 18, bottomY + 42, w - 36, bottomH - 58, {
    theme,
    activeIndex: state.activeUniqueIndex,
  });

  const phaseText = phaseLabel(state.phase);
  ctx.save();
  ctx.fillStyle = theme.highlight;
  ctx.font = "700 18px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(phaseText, x + w - 20, topY + 22);
  ctx.restore();

  if (state.phase === "collect" && state.activeSourceIndex != null && state.activeUniqueIndex != null) {
    drawMoveArrow(ctx, outputBars[state.activeSourceIndex], uniqueBars[state.activeUniqueIndex], theme.highlight, state.movingValue);
  }
  if (state.phase === "write" && state.activeOutputIndex != null && state.activeUniqueIndex != null) {
    drawMoveArrow(ctx, uniqueBars[state.activeUniqueIndex], outputBars[state.activeOutputIndex], theme.swap, state.movingValue);
  }
}

function drawSection(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string) {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.68)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.24)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 18px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + 18, y + 22);
  ctx.restore();
}

function drawValueChart(
  ctx: CanvasRenderingContext2D,
  values: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { theme: Theme; activeIndex?: number; sorted?: number[]; dimAfter?: number },
) {
  const bars = layoutBars(values, x, y, w, h - 24);
  bars.forEach((bar, i) => {
    const active = opts.activeIndex === i;
    const sorted = opts.sorted?.includes(i);
    const dim = opts.dimAfter != null && i >= opts.dimAfter;
    drawBar(ctx, bar, active ? opts.theme.highlight : sorted ? opts.theme.sorted : opts.theme.bar, active, dim);
    drawLabel(ctx, String(bar.value), bar.cx, y + h - 6, active ? opts.theme.highlight : "#cbd5e1");
  });
  return bars;
}

function drawUniqueChart(
  ctx: CanvasRenderingContext2D,
  values: number[],
  counts: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { theme: Theme; activeIndex?: number },
) {
  const items = values.map((value, i) => ({ value, count: counts[i] ?? 0, originalIndex: i }));
  const bars = layoutBars(items.map((item) => item.value), x, y, w, h - 38);
  const byOriginalIndex: Bar[] = [];
  items.forEach((item, index) => {
    const bar = bars[index];
    byOriginalIndex[item.originalIndex] = bar;
    const active = opts.activeIndex === item.originalIndex;
    const empty = item.count <= 0;
    drawBar(ctx, bar, active ? opts.theme.swap : opts.theme.pivot, active, empty);
    drawLabel(ctx, String(item.value), bar.cx, y + h - 24, empty ? "rgba(221,214,254,0.45)" : active ? opts.theme.swap : "#ddd6fe");
    drawCountBadge(ctx, bar.cx, y + h - 7, item.count, active ? opts.theme.highlight : opts.theme.sorted, empty);
  });
  return byOriginalIndex;
}

function layoutBars(values: number[], x: number, y: number, w: number, h: number): Bar[] {
  if (!values.length) return [];
  const maxAbs = Math.max(...values.map((n) => Math.abs(n)), 1);
  const gap = Math.max(3, Math.min(10, w / values.length * 0.12));
  const barW = Math.max(6, (w - gap * (values.length - 1)) / values.length);
  return values.map((value, i) => {
    const bh = Math.max(8, Math.abs(value) / maxAbs * (h - 10));
    const bx = x + i * (barW + gap);
    const by = y + h - bh;
    return { x: bx, y: by, w: barW, h: bh, cx: bx + barW / 2, top: by, value };
  });
}

function drawBar(ctx: CanvasRenderingContext2D, bar: Bar | undefined, color: string, active: boolean, dim: boolean) {
  if (!bar) return;
  ctx.save();
  ctx.globalAlpha = dim ? 0.35 : 1;
  ctx.fillStyle = color;
  if (active) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, bar.x, bar.y, bar.w, bar.h, Math.min(10, bar.w / 2));
  ctx.fill();
  if (active) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    roundRect(ctx, bar.x, bar.y, bar.w, bar.h, Math.min(10, bar.w / 2));
    ctx.stroke();
  }
  ctx.restore();
}

function drawMoveArrow(ctx: CanvasRenderingContext2D, from: Bar | undefined, to: Bar | undefined, color: string, value?: number) {
  if (!from || !to) return;
  const midY = (from.top + to.top) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(from.cx, from.top);
  ctx.bezierCurveTo(from.cx, midY, to.cx, midY, to.cx, to.top);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc((from.cx + to.cx) / 2, midY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value ?? ""), (from.cx + to.cx) / 2, midY + 1);
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "800 15px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCountBadge(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, color: string, empty = false) {
  ctx.save();
  ctx.globalAlpha = empty ? 0.42 : 1;
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 15, y - 11, 30, 22, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "800 14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(count), x, y + 1);
  ctx.restore();
}

function phaseLabel(phase: NonNullable<Frame["counting"]>["phase"]) {
  if (phase === "collect") return "collect unique values";
  if (phase === "sort") return "sort unique chart";
  if (phase === "write") return "move back + decrement count";
  return "done";
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
