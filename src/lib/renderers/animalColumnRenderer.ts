import landTileUrl from "@/assets/sprites/land-tile.jpg";
import { LandTileMapSprite, type LandTileMap } from "@/lib/sprites/LandTileMapSprite";
import type { Frame } from "../algorithms";
import { getSprite, spriteForWeight, weightForValue, type AnimalColumnSettings } from "../animalColumns";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

type Options = {
  previousFrame?: Frame | null;
  transitionProgress?: number;
  labelMinY?: number;
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

const chartLandSprite = new LandTileMapSprite({ imageUrl: landTileUrl });
const TREE_MAP: LandTileMap = {
  tileWidth: 38,
  rows: [
    { height: 42, tiles: ["tree"] },
    { height: 42, tiles: ["tree"] },
  ],
};
const GROUND_MAP: LandTileMap = {
  tileWidth: 42,
  rows: [
    { height: 22, tiles: ["grass"] },
    { height: 78, tiles: ["stone"] },
  ],
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

  const landH = getTileMapHeight(GROUND_MAP);
  const landY = chartBottom - landH;
  const baseline = landY;
  const gap = Math.max(8, Math.floor((chartW / arr.length) * 0.28));
  const slotW = (chartW - gap * (arr.length - 1)) / arr.length;
  const labelReserve = arr.length <= 30 ? Math.min(76, Math.max(46, chartH * 0.22)) : 0;
  const animalAreaH = Math.max(30, chartH - landH - labelReserve);
  const maxAnimalH = Math.max(30, Math.min(animalAreaH, slotW * 4.4));
  const minAnimalH = Math.max(24, Math.min(maxAnimalH * 0.32, slotW * 1.5));
  const progress = easeInOutCubic(clamp01(options.transitionProgress ?? 1));
  const movingPair = getMovingSwapPair(frame, options.previousFrame);
  const moving = new Set(movingPair ?? []);
  const labelMinY = options.labelMinY ?? chartTop + 4;
  const shapes = arr.map((value, index) => {
    const weight = weightForValue(value);
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

  drawSceneBackdrop(ctx, padding, chartTop, chartW, Math.max(0, landY - chartTop));
  drawLandGround(ctx, padding, landY, chartW, landH);

  for (const shape of shapes) {
    if (moving.has(shape.index)) continue;
    drawSingleAnimal(ctx, shape, frame, theme, options.settings, false, progress, labelMinY);
  }

  if (movingPair) drawMovingSwap(ctx, shapes, movingPair, frame, theme, options.settings, progress, chartH, labelMinY);
  else {
    for (const shape of shapes) {
      if (frame.swap.includes(shape.index)) drawSingleAnimal(ctx, shape, frame, theme, options.settings, true, progress, labelMinY);
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
  labelMinY: number,
) {
  const [a, b] = pair;
  const aShape = shapes[a];
  const bShape = shapes[b];
  if (!aShape || !bShape) return;

  const lift = Math.sin(progress * Math.PI) * Math.min(chartH * 0.18, 90) * settings.jumpIntensity;
  drawSwapTrack(ctx, aShape, bShape, theme.swap, progress);
  drawSingleAnimal(ctx, { ...aShape, x: lerp(bShape.x, aShape.x, progress), y: aShape.y - lift }, frame, theme, settings, true, progress, labelMinY);
  drawSingleAnimal(ctx, { ...bShape, x: lerp(aShape.x, bShape.x, progress), y: bShape.y - lift }, frame, theme, settings, true, progress, labelMinY);
}

function drawSingleAnimal(
  ctx: CanvasRenderingContext2D,
  shape: AnimalShape,
  frame: Frame,
  theme: Theme,
  settings: AnimalColumnSettings,
  isSwap: boolean,
  progress: number,
  labelMinY: number,
) {
  const entry = spriteForWeight(shape.weight);
  const sprite = entry ? getSprite(entry) : null;
  const isActive = isSwap || frame.swap.includes(shape.index);
  const animalH = shape.h;
  const animalW = Math.min(shape.w * 1.45, animalH * 0.86) * (entry?.widthScale ?? 1);
  const x = shape.x + shape.w / 2 - animalW / 2;
  const y = shape.y + (entry?.baselineOffset ?? 0);

  if (sprite) {
    sprite.setAction(isActive ? "jump" : "idle");
    sprite.update(1000 / 30);
  }

  const drawn = sprite?.draw(ctx, x, y, { width: animalW, height: animalH });
  if (!drawn) drawFallbackAnimal(ctx, x, y, animalW, animalH, isActive ? theme.swap : theme.bar);

  if (frame.arr.length <= 30) {
    const isSelected = frame.highlight.includes(shape.index);
    drawValueLabel(ctx, shape, y, isActive, isSelected, labelMinY);
  }
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

function drawValueLabel(ctx: CanvasRenderingContext2D, shape: AnimalShape, y: number, active: boolean, selected: boolean, minY: number) {
  const label = String(shape.value);
  const boardW = Math.max(46, shape.w * 1.28);
  const boardH = Math.max(32, Math.min(56, boardW * 0.58));
  const centerX = shape.x + shape.w / 2;
  const poleH = Math.max(10, Math.min(20, boardH * 0.48));
  const selectionLift = selected ? Math.max(16, Math.min(32, boardH * 0.62)) : 0;
  const boardX = centerX - boardW / 2;
  const boardY = Math.max(minY, y - boardH - poleH - 7 - selectionLift);
  let fontSize = Math.min(boardH * 0.84, boardW * 0.6);
  ctx.font = `900 ${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  while (fontSize > 14 && ctx.measureText(label).width > boardW - 8) {
    fontSize -= 1;
    ctx.font = `900 ${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
  }
  drawWeightSignSprite(ctx, boardX, boardY, boardW, boardH, poleH + selectionLift, active || selected);
  ctx.fillStyle = active ? "#fef08a" : "#fff7ed";
  ctx.strokeStyle = "rgba(46, 16, 4, 0.78)";
  ctx.lineWidth = 3;
  ctx.strokeText(label, centerX, boardY + boardH * 0.68);
  ctx.fillText(label, centerX, boardY + boardH * 0.68);
}

function drawWeightSignSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  poleH: number,
  active: boolean,
) {
  const centerX = x + w / 2;
  const poleW = Math.max(5, w * 0.13);
  const poleX = centerX - poleW / 2;
  const poleY = y + h - 1;

  const poleGrad = ctx.createLinearGradient(poleX, poleY, poleX + poleW, poleY);
  poleGrad.addColorStop(0, "#5f3518");
  poleGrad.addColorStop(0.45, "#a16207");
  poleGrad.addColorStop(1, "#3f220f");
  ctx.fillStyle = poleGrad;
  roundRect(ctx, poleX, poleY, poleW, poleH, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(30, 16, 8, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const wood = ctx.createLinearGradient(x, y, x, y + h);
  wood.addColorStop(0, active ? "#d97706" : "#b45309");
  wood.addColorStop(0.52, active ? "#92400e" : "#7c2d12");
  wood.addColorStop(1, active ? "#78350f" : "#451a03");
  ctx.fillStyle = wood;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();

  ctx.strokeStyle = active ? "#fde68a" : "#92400e";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 5);
  ctx.clip();
  ctx.strokeStyle = "rgba(254, 243, 199, 0.28)";
  ctx.lineWidth = 1;
  for (let lineY = y + h * 0.28; lineY < y + h; lineY += h * 0.28) {
    ctx.beginPath();
    ctx.moveTo(x + 5, lineY);
    ctx.lineTo(x + w - 5, lineY + Math.sin(lineY) * 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneBackdrop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#05090d";
  ctx.fillRect(x, y, w, h);
  const treeH = Math.min(96, Math.max(42, h * 0.34));
  const skyH = Math.max(0, h - treeH);
  if (skyH > 0) chartLandSprite.drawBackground(ctx, "night", x, y, w, skyH);
  if (treeH > 0) chartLandSprite.drawMap(ctx, x, y + skyH, w, treeH, TREE_MAP);
  ctx.fillStyle = "rgba(2, 6, 23, 0.2)";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawLandGround(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#06110b";
  ctx.fillRect(x, y, w, h);
  chartLandSprite.drawMap(ctx, x, y, w, h, GROUND_MAP);
  ctx.fillStyle = "rgba(2, 6, 23, 0.18)";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function getTileMapHeight(map: LandTileMap) {
  return map.rows.reduce((total, row) => total + row.height, 0);
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
