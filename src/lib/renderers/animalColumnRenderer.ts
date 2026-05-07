import type { Frame } from "../algorithms";
import { getSprite, spriteForWeight, weightForValue, type AnimalColumnSettings } from "../animalColumns";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

type Options = {
  previousFrame?: Frame | null;
  transitionProgress?: number;
  settings: AnimalColumnSettings;
};

type AnimalShape = {
  x: number;
  y: number;
  w: number;
  h: number;
  value: number;
  index: number;
  weight: number;
};

export function drawAnimalColumns(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  chartTop: number,
  chartW: number,
  chartH: number,
  chartBottom: number,
  theme: Theme,
  options: Options,
) {
  const arr = frame.arr;
  if (!arr.length) return;

  const min = Math.min(...arr, 0);
  const max = Math.max(...arr, 0);
  const range = Math.max(1, max - min);
  const plotH = Math.max(0, chartH - 72);
  const baseline = chartBottom - ((0 - min) / range) * plotH;
  const gap = Math.max(4, Math.floor((chartW / arr.length) * 0.12));
  const slotW = (chartW - gap * (arr.length - 1)) / arr.length;
  const maxAnimalH = Math.min(chartH * 0.72, slotW * 4.4);
  const minAnimalH = Math.max(24, Math.min(maxAnimalH * 0.3, slotW * 1.35));
  const progress = easeInOutCubic(clamp01(options.transitionProgress ?? 1));
  const movingPair = getMovingSwapPair(frame, options.previousFrame);
  const moving = new Set(movingPair ?? []);
  const shapes = arr.map((value, index) => {
    const weight = weightForValue(value, arr);
    const h = (minAnimalH + ((weight - 1) / 19) * (maxAnimalH - minAnimalH)) * options.settings.spriteScale;
    const w = Math.max(24, slotW);
    return {
      x: padding + index * (slotW + gap),
      y: baseline - h,
      w,
      h,
      value,
      index,
      weight,
    };
  });

  drawBaseline(ctx, padding, baseline, chartW, theme);

  for (const shape of shapes) {
    if (moving.has(shape.index)) continue;
    drawSingleAnimal(ctx, shape, frame, theme, options.settings, false, progress);
  }

  if (movingPair) drawMovingSwap(ctx, shapes, movingPair, frame, theme, options.settings, progress, chartH);
  else {
    for (const shape of shapes) {
      if (frame.swap.includes(shape.index)) drawSingleAnimal(ctx, shape, frame, theme, options.settings, true, progress);
    }
  }

  void chartTop;
}

function drawMovingSwap(
  ctx: CanvasRenderingContext2D,
  shapes: AnimalShape[],
  pair: [number, number],
  frame: Frame,
  theme: Theme,
  settings: AnimalColumnSettings,
  progress: number,
  chartH: number,
) {
  const [a, b] = pair;
  const aShape = shapes[a];
  const bShape = shapes[b];
  if (!aShape || !bShape) return;

  const lift = Math.sin(progress * Math.PI) * Math.min(chartH * 0.18, 90) * settings.jumpIntensity;
  drawSwapTrack(ctx, aShape, bShape, theme.swap, progress);
  drawSingleAnimal(ctx, { ...aShape, x: lerp(bShape.x, aShape.x, progress), y: aShape.y - lift }, frame, theme, settings, true, progress);
  drawSingleAnimal(ctx, { ...bShape, x: lerp(aShape.x, bShape.x, progress), y: bShape.y - lift }, frame, theme, settings, true, progress);
}

function drawSingleAnimal(
  ctx: CanvasRenderingContext2D,
  shape: AnimalShape,
  frame: Frame,
  theme: Theme,
  settings: AnimalColumnSettings,
  isSwap: boolean,
  progress: number,
) {
  const entry = spriteForWeight(shape.weight);
  const sprite = entry ? getSprite(entry) : null;
  const isActive = isSwap || frame.swap.includes(shape.index) || (settings.highlightJump && frame.highlight.includes(shape.index));
  const animalH = shape.h;
  const animalW = Math.min(shape.w * 1.8, animalH * 0.86) * (entry?.widthScale ?? 1);
  const x = shape.x + shape.w / 2 - animalW / 2;
  const y = shape.y + (entry?.baselineOffset ?? 0);

  if (sprite) {
    sprite.setAction(isActive ? "jump" : "idle");
    sprite.update(1000 / 30);
  }

  const drawn = sprite?.draw(ctx, x, y, { width: animalW, height: animalH });
  if (!drawn) drawFallbackAnimal(ctx, x, y, animalW, animalH, isActive ? theme.swap : theme.bar);

  if (frame.arr.length <= 30) drawValueLabel(ctx, shape, y, isActive);
}

function drawFallbackAnimal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, Math.min(16, w / 4));
  ctx.fill();
  ctx.fillStyle = "rgba(15,23,42,0.82)";
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y + h * 0.32, Math.max(2, w * 0.07), 0, Math.PI * 2);
  ctx.arc(x + w * 0.65, y + h * 0.32, Math.max(2, w * 0.07), 0, Math.PI * 2);
  ctx.fill();
}

function drawValueLabel(ctx: CanvasRenderingContext2D, shape: AnimalShape, y: number, active: boolean) {
  ctx.fillStyle = active ? "#ffffff" : "rgba(255,255,255,0.86)";
  ctx.font = `${active ? "800" : "600"} ${Math.min(24, Math.max(11, Math.floor(shape.w * 0.38)))}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(String(shape.value), shape.x + shape.w / 2, y - 8);
}

function drawBaseline(ctx: CanvasRenderingContext2D, padding: number, baseline: number, chartW: number, theme: Theme) {
  ctx.save();
  ctx.strokeStyle = theme.bar;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, baseline);
  ctx.lineTo(padding + chartW, baseline);
  ctx.stroke();
  ctx.restore();
}

function getMovingSwapPair(frame: Frame, previousFrame?: Frame | null): [number, number] | null {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return null;
  const [a, b] = frame.swap;
  if (previousFrame.arr.length !== frame.arr.length) return null;
  if (previousFrame.arr[a] !== frame.arr[b] || previousFrame.arr[b] !== frame.arr[a]) return null;
  return [a, b];
}

function drawSwapTrack(ctx: CanvasRenderingContext2D, a: AnimalShape, b: AnimalShape, color: string, progress: number) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const y = Math.min(a.y, b.y) - 24;
  ctx.save();
  ctx.globalAlpha = 0.24 + 0.35 * Math.sin(progress * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(ax, y);
  ctx.quadraticCurveTo((ax + bx) / 2, y - Math.abs(bx - ax) * 0.16, bx, y);
  ctx.stroke();
  ctx.restore();
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
