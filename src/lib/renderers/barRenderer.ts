import type { Frame } from "../algorithms";
import type { Theme } from "./theme";

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

type PrefixFlip = {
  from: number;
  to: number;
  indices: number[];
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
  if (!arr.length) return;

  const min = Math.min(...arr, 0);
  const max = Math.max(...arr, 0);
  const range = Math.max(1, max - min);
  const plotH = Math.max(0, chartH - 60);
  const baseline = chartBottom - ((0 - min) / range) * plotH;
  const gap = Math.max(2, Math.floor(chartW / arr.length * 0.15));
  const barW = (chartW - gap * (arr.length - 1)) / arr.length;
  const progress = easeInOutCubic(clamp01(options.transitionProgress ?? 1));
  const movingPair = getMovingSwapPair(frame, options.previousFrame);
  const prefixFlip = movingPair ? null : getMovingPrefixFlip(frame, options.previousFrame);
  const moving = new Set(movingPair ?? prefixFlip?.indices ?? []);
  const shapes: BarShape[] = [];

  for (let i = 0; i < arr.length; i++) {
    const valueY = chartBottom - ((arr[i] - min) / range) * plotH;
    const x = padding + i * (barW + gap);
    shapes.push({ x, y: Math.min(valueY, baseline), w: barW, h: Math.abs(valueY - baseline), value: arr[i], index: i });
  }

  drawZeroAxis(ctx, padding, baseline, chartW, min < 0 && max > 0);

  for (const shape of shapes) {
    if (moving.has(shape.index)) continue;
    drawSingleBar(ctx, shape, frame, theme, false, 1);
  }

  if (movingPair) {
    drawMovingSwap(ctx, shapes, movingPair, frame, theme, progress, chartH);
  } else if (prefixFlip) {
    drawMovingPrefixFlip(ctx, shapes, prefixFlip, frame, theme, progress, chartH);
  } else {
    for (const shape of shapes) {
      if (frame.swap.includes(shape.index)) drawSingleBar(ctx, shape, frame, theme, true, 1);
    }
  }

  void chartTop;
}

function drawZeroAxis(ctx: CanvasRenderingContext2D, padding: number, baseline: number, chartW: number, visible: boolean) {
  if (!visible) return;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(padding, baseline);
  ctx.lineTo(padding + chartW, baseline);
  ctx.stroke();
  ctx.restore();
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

function drawMovingPrefixFlip(
  ctx: CanvasRenderingContext2D,
  shapes: BarShape[],
  flip: PrefixFlip,
  frame: Frame,
  theme: Theme,
  progress: number,
  chartH: number,
) {
  const lift = Math.sin(progress * Math.PI) * Math.min(58, chartH * 0.16);
  drawFlipTrack(ctx, shapes, flip, theme.swap, progress);

  for (const index of flip.indices) {
    const shape = shapes[index];
    if (!shape) continue;
    const sourceIndex = flip.from + flip.to - index;
    const sourceShape = shapes[sourceIndex];
    if (!sourceShape) continue;
    const distanceFromCenter = Math.abs(index - (flip.from + flip.to) / 2);
    const arcLift = lift * (0.55 + distanceFromCenter / Math.max(1, flip.indices.length - 1));
    drawSingleBar(ctx, {
      ...shape,
      x: lerp(sourceShape.x, shape.x, progress),
      y: shape.y - arcLift,
    }, frame, theme, true, progress);
  }
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
    const labelY = shape.value < 0 ? shape.y + shape.h + 22 : shape.y - 10;
    ctx.fillText(String(shape.value), shape.x + shape.w / 2, labelY);
  }
}

function getMovingSwapPair(frame: Frame, previousFrame?: Frame | null): [number, number] | null {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return null;
  const [a, b] = frame.swap;
  if (previousFrame.arr.length !== frame.arr.length) return null;
  if (previousFrame.arr[a] !== frame.arr[b] || previousFrame.arr[b] !== frame.arr[a]) return null;
  return [a, b];
}

function getMovingPrefixFlip(frame: Frame, previousFrame?: Frame | null): PrefixFlip | null {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length < 3) return null;
  if (previousFrame.arr.length !== frame.arr.length) return null;
  const from = numberVar(frame, "from") ?? frame.swap[0];
  const to = numberVar(frame, "to") ?? frame.swap[frame.swap.length - 1];
  if (from == null || to == null || from < 0 || to >= frame.arr.length || from >= to) return null;
  const indices = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (indices.length !== frame.swap.length || !indices.every((index) => frame.swap.includes(index))) return null;
  const isReversed = indices.every((index) => previousFrame.arr[from + to - index] === frame.arr[index]);
  return isReversed ? { from, to, indices } : null;
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

function drawFlipTrack(ctx: CanvasRenderingContext2D, shapes: BarShape[], flip: PrefixFlip, color: string, progress: number) {
  const first = shapes[flip.from];
  const last = shapes[flip.to];
  if (!first || !last) return;
  const x1 = first.x + first.w / 2;
  const x2 = last.x + last.w / 2;
  const y = Math.min(...flip.indices.map((index) => shapes[index]?.y ?? Number.POSITIVE_INFINITY)) - 26;
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.45 * Math.sin(progress * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo((x1 + x2) / 2, y - Math.abs(x2 - x1) * 0.16 - 18, x2, y);
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
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

function numberVar(frame: Frame, key: string) {
  const value = frame.vars[key];
  return typeof value === "number" ? value : undefined;
}
