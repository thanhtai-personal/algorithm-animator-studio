import type { Frame } from "./algorithms";
import type { Theme } from "./rendering/theme";

type BarRenderOptions = {
  previousFrame?: Frame | null;
  transitionProgress?: number;
};

type BarShape = {
  x: number;
  y: number;
  w: number;
  h: number;
  value: number;
  index: number;
};

export function drawBars(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  chartTop: number,
  chartW: number,
  chartH: number,
  chartBottom: number,
  theme: Theme,
  options: BarRenderOptions = {},
) {
  const arr = frame.arr;
  const max = Math.max(...arr, 1);
  const gap = Math.max(2, Math.floor(chartW / arr.length * 0.15));
  const barW = (chartW - gap * (arr.length - 1)) / arr.length;
  const progress = easeInOutCubic(clamp01(options.transitionProgress ?? 1));
  const movingPair = getMovingSwapPair(frame, options.previousFrame);
  const moving = new Set(movingPair ?? []);
  const shapes: BarShape[] = [];

  for (let i = 0; i < arr.length; i++) {
    const h = (arr[i] / max) * (chartH - 60);
    const x = padding + i * (barW + gap);
    shapes.push({ x, y: chartBottom - h, w: barW, h, value: arr[i], index: i });
  }

  for (const shape of shapes) {
    if (moving.has(shape.index)) continue;
    drawSingleBar(ctx, shape, frame, theme, false, 1);
  }

  if (movingPair) {
    drawMovingSwap(ctx, shapes, movingPair, frame, theme, progress, chartH);
  } else {
    for (const shape of shapes) {
      if (frame.swap.includes(shape.index)) drawSingleBar(ctx, shape, frame, theme, true, 1);
    }
  }

  void chartTop;
}

function drawMovingSwap(
  ctx: CanvasRenderingContext2D,
  shapes: BarShape[],
  pair: [number, number],
  frame: Frame,
  theme: Theme,
  progress: number,
  chartH: number,
) {
  const [a, b] = pair;
  const aShape = shapes[a];
  const bShape = shapes[b];
  if (!aShape || !bShape) return;

  const lift = Math.sin(progress * Math.PI) * Math.min(44, chartH * 0.1);
  const movingToA = {
    ...aShape,
    x: lerp(bShape.x, aShape.x, progress),
    y: aShape.y - lift,
  };
  const movingToB = {
    ...bShape,
    x: lerp(aShape.x, bShape.x, progress),
    y: bShape.y - lift,
  };

  drawSwapTrack(ctx, aShape, bShape, theme.swap, progress);
  drawSingleBar(ctx, movingToA, frame, theme, true, progress);
  drawSingleBar(ctx, movingToB, frame, theme, true, progress);
}

function drawSingleBar(
  ctx: CanvasRenderingContext2D,
  shape: BarShape,
  frame: Frame,
  theme: Theme,
  isSwap: boolean,
  progress: number,
) {
  let color = theme.bar;
  if (frame.sorted.includes(shape.index)) color = theme.sorted;
  if (frame.highlight.includes(shape.index)) color = theme.highlight;
  if (isSwap || frame.swap.includes(shape.index)) color = theme.swap;
  if (frame.pivot === shape.index) color = theme.pivot;
  const r = Math.min(10, shape.w / 2);

  ctx.save();
  if (isSwap) {
    ctx.shadowColor = theme.swap;
    ctx.shadowBlur = 18 + 16 * Math.sin(progress * Math.PI);
  }
  ctx.fillStyle = color;
  roundRect(ctx, shape.x, shape.y, shape.w, shape.h, r);
  ctx.fill();
  if (isSwap) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, shape.w * 0.06);
    roundRect(ctx, shape.x, shape.y, shape.w, shape.h, r);
    ctx.stroke();
  }
  ctx.restore();

  if (frame.arr.length <= 30) {
    ctx.fillStyle = isSwap ? "#ffffff" : "rgba(255,255,255,0.85)";
    ctx.font = `${isSwap ? "800" : "600"} ${Math.min(28, Math.floor(shape.w * 0.6))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(String(shape.value), shape.x + shape.w / 2, shape.y - 10);
  }
}

function getMovingSwapPair(frame: Frame, previousFrame?: Frame | null): [number, number] | null {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return null;
  const [a, b] = frame.swap;
  if (previousFrame.arr.length !== frame.arr.length) return null;
  if (previousFrame.arr[a] !== frame.arr[b] || previousFrame.arr[b] !== frame.arr[a]) return null;
  return [a, b];
}

function drawSwapTrack(ctx: CanvasRenderingContext2D, a: BarShape, b: BarShape, color: string, progress: number) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const y = Math.min(a.y, b.y) - 28;
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.35 * Math.sin(progress * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(ax, y);
  ctx.quadraticCurveTo((ax + bx) / 2, y - Math.abs(bx - ax) * 0.18, bx, y);
  ctx.stroke();
  ctx.restore();
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
