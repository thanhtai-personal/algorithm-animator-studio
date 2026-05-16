import { COMPLEXITY, Frame } from "./algorithms";
import type { AnimalColumnSettings } from "./animalColumns";
import { drawFocusPointer } from "./focusPointerRenderer";
import { LongContentScene } from "./longContentTimeline";
import { renderFrame, Theme } from "./renderer";
import { roundRect, shade } from "./renderers/shapes";

const W = 1920;
const H = 1080;

type RenderLongContentParams = {
  frame?: Frame | null;
  previousFrame?: Frame | null;
  scene: LongContentScene;
  sceneProgress: number;
  previousSceneWasAnimation?: boolean;
  timelineProgress: number;
  algoId: string;
  algoName: string;
  code: string;
  theme: Theme;
  showCode: boolean;
  animalColumns: AnimalColumnSettings;
  frameLabel: string;
  channelName?: string;
};

export function renderLongContentFrame(ctx: CanvasRenderingContext2D, params: RenderLongContentParams) {
  const { theme, scene, sceneProgress, timelineProgress } = params;
  const layout = getSceneLayout(params.scene.animation, params.previousSceneWasAnimation, sceneProgress);
  drawBackground(ctx, theme);
  drawBrand(ctx, params.channelName ?? "Code Visual Lab");
  drawScriptPanel(ctx, params, layout.textPanel);
  drawAnimationPanel(ctx, params, layout.chartReveal);
  drawBottomBar(ctx, scene, sceneProgress, timelineProgress, params.frameLabel);
  if (layout.chartReveal > 0.98 || !scene.animation) {
    drawFocusPointer(ctx, {
      frame: params.frame,
      previousFrame: params.previousFrame,
      scene,
      sceneProgress,
      theme,
      showCode: params.showCode,
      textPanel: layout.textPanel,
      chartReveal: layout.chartReveal,
    });
  }
}

type PanelRect = { x: number; y: number; w: number; h: number };

function getSceneLayout(sceneHasChart: boolean | undefined, previousSceneWasAnimation: boolean | undefined, sceneProgress: number) {
  const chartReveal = getChartReveal(sceneHasChart, previousSceneWasAnimation, sceneProgress);
  const textPanel = {
    x: 62,
    y: 132,
    w: lerp(1790, 690, chartReveal),
    h: 820,
  };
  return { chartReveal, textPanel };
}

function getChartReveal(sceneHasChart: boolean | undefined, previousSceneWasAnimation: boolean | undefined, sceneProgress: number) {
  const transition = 0.045;
  if (sceneHasChart) return easeOutCubic(clamp01(sceneProgress / transition));
  if (previousSceneWasAnimation) return 1 - easeOutCubic(clamp01(sceneProgress / transition));
  return 0;
}

function drawBackground(ctx: CanvasRenderingContext2D, theme: Theme) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, shade(theme.bg, 4));
  grad.addColorStop(0.48, theme.bg);
  grad.addColorStop(1, shade(theme.bg, -18));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = theme.highlight;
  ctx.beginPath();
  ctx.arc(W * 0.78, H * 0.18, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.swap;
  ctx.beginPath();
  ctx.arc(W * 0.15, H * 0.95, 340, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawBrand(ctx: CanvasRenderingContext2D, channelName: string) {
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "700 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(channelName, 72, 68);
  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font = "500 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Long-form algorithm animation · 16:9 YouTube", 72, 102);
}

function drawScriptPanel(ctx: CanvasRenderingContext2D, params: RenderLongContentParams, panel: PanelRect) {
  const padX = 42;
  const contentX = panel.x + padX;
  const contentW = panel.w - padX * 2;
  const bottomY = panel.y + panel.h - 44;

  ctx.fillStyle = "rgba(15,23,42,0.68)";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 28);
  ctx.fill();
  ctx.stroke();

  const { scene, theme } = params;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.highlight;
  ctx.font = "800 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText((scene.kindLabel || scene.kind).toUpperCase(), contentX, panel.y + 58);

  let cursorY = panel.y + 130;
  ctx.fillStyle = "#ffffff";
  cursorY = drawFittedText(ctx, scene.title, {
    x: contentX,
    y: cursorY,
    maxWidth: contentW,
    initialSize: panel.w > 900 ? 72 : 54,
    minSize: 42,
    weight: 900,
    lineHeightRatio: 1.12,
    maxLines: panel.w > 900 ? 3 : 2,
  }) + 26;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "500 28px ui-sans-serif, system-ui, sans-serif";
  cursorY = drawWrappedText(ctx, scene.subtitle, contentX, cursorY, contentW, 38, 3) + 62;

  ctx.font = "600 25px ui-sans-serif, system-ui, sans-serif";
  const bulletTextX = contentX + 34;
  const bulletW = contentW - 46;
  const bullets = scene.bullets.slice(0, panel.w > 900 ? 6 : 5);

  for (let index = 0; index < bullets.length; index++) {
    const lines = getWrappedLines(ctx, bullets[index], bulletW, 2).lines;
    const lineHeight = 32;
    const blockHeight = Math.max(lineHeight, lines.length * lineHeight);
    if (cursorY + blockHeight > bottomY) break;

    ctx.fillStyle = index === 0 ? theme.highlight : "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(contentX + 7, cursorY - 9, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    lines.forEach((line, lineIndex) => ctx.fillText(line, bulletTextX, cursorY + lineIndex * lineHeight));
    cursorY += blockHeight + 28;
  }
}

function drawAnimationPanel(ctx: CanvasRenderingContext2D, params: RenderLongContentParams, reveal: number) {
  if (reveal <= 0.01) return;
  const baseX = 770;
  const y = 120;
  const x = lerp(W + 40, baseX, reveal);
  const w = 1080 * reveal;
  const h = 730;
  if (w < 40) return;
  ctx.fillStyle = "rgba(2,6,23,0.72)";
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 34);
  ctx.fill();
  ctx.stroke();

  const innerPad = 26;
  if (w <= innerPad * 2 + 2) return;
  const animCanvas = getReusableCanvas();
  animCanvas.width = 1280;
  animCanvas.height = 720;
  const animCtx = animCanvas.getContext("2d");
  if (!animCtx) return;

  if (!params.frame) {
    drawEmptyAnimationFallback(ctx, x + innerPad, y + innerPad, Math.max(1, w - innerPad * 2), h - innerPad * 2);
    return;
  }

  renderFrame(animCtx, params.frame, {
    title: params.algoName,
    subtitle: params.scene.animation ? "Step-by-step animation" : params.scene.title,
    theme: params.theme,
    code: params.code,
    showCode: params.showCode,
    complexity: COMPLEXITY[params.algoId],
    previousFrame: params.previousFrame,
    transitionProgress: params.sceneProgress,
    algorithmId: params.algoId,
    animalColumns: params.animalColumns,
  }, animCanvas.width, animCanvas.height);

  ctx.save();
  roundRect(ctx, x + innerPad, y + innerPad, w - innerPad * 2, h - innerPad * 2, 24);
  ctx.clip();
  ctx.drawImage(animCanvas, x + innerPad, y + innerPad, w - innerPad * 2, h - innerPad * 2);
  ctx.restore();
}

function drawEmptyAnimationFallback(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 24);
  ctx.clip();
  ctx.fillStyle = "rgba(15,23,42,0.92)";
  ctx.fillRect(x, y, w, h);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = "800 34px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Preview chưa có frame hợp lệ", x + w / 2, y + h / 2 - 16);
  ctx.fillStyle = "rgba(255,255,255,0.56)";
  ctx.font = "500 24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Hãy reset timeline hoặc chọn lại thuật toán.", x + w / 2, y + h / 2 + 28);
  ctx.restore();
}

function drawBottomBar(
  ctx: CanvasRenderingContext2D,
  scene: LongContentScene,
  sceneProgress: number,
  timelineProgress: number,
  frameLabel: string,
) {
  const x = 770;
  const y = 890;
  const w = 1080;
  const h = 120;
  ctx.fillStyle = "rgba(15,23,42,0.66)";
  roundRect(ctx, x, y, w, h, 28);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 30px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(scene.title, x + 32, y + 46);
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "600 22px ui-monospace, monospace";
  ctx.fillText(frameLabel, x + 32, y + 84);

  drawProgress(ctx, x + 610, y + 40, 390, 12, sceneProgress, "rgba(250,204,21,0.95)");
  drawProgress(ctx, x + 610, y + 76, 390, 12, timelineProgress, "rgba(34,197,94,0.95)");
}

function drawProgress(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, fill: string) {
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, Math.max(h, w * value), h, h / 2);
  ctx.fill();
}

type FittedTextOptions = {
  x: number;
  y: number;
  maxWidth: number;
  initialSize: number;
  minSize: number;
  weight: number;
  lineHeightRatio: number;
  maxLines: number;
};

function drawFittedText(ctx: CanvasRenderingContext2D, text: string, options: FittedTextOptions) {
  let size = options.initialSize;
  let wrapped = getWrappedLines(ctx, text, options.maxWidth, options.maxLines);

  while (size > options.minSize) {
    ctx.font = `${options.weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
    wrapped = getWrappedLines(ctx, text, options.maxWidth, options.maxLines);
    if (!wrapped.truncated) break;
    size -= 2;
  }

  ctx.font = `${options.weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
  const lineHeight = Math.round(size * options.lineHeightRatio);
  wrapped.lines.forEach((line, index) => ctx.fillText(line, options.x, options.y + index * lineHeight));
  return options.y + Math.max(1, wrapped.lines.length) * lineHeight;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const lines = getWrappedLines(ctx, text, maxWidth, maxLines).lines;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + Math.max(1, lines.length) * lineHeight;
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let truncated = false;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
      continue;
    }

    lines.push(line);
    line = word;
    if (lines.length === maxLines) {
      truncated = true;
      line = "";
      break;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === 0) lines.push("");
  if (truncated) lines[lines.length - 1] = fitWithEllipsis(ctx, lines[lines.length - 1], maxWidth);
  return { lines, truncated };
}

function fitWithEllipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const suffix = "…";
  let fitted = text;
  while (fitted.length > 0 && ctx.measureText(`${fitted}${suffix}`).width > maxWidth) {
    fitted = fitted.slice(0, -1).trimEnd();
  }
  return fitted ? `${fitted}${suffix}` : suffix;
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function easeOutCubic(value: number) {
  const safe = clamp01(value);
  return 1 - Math.pow(1 - safe, 3);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

let reusableCanvas: HTMLCanvasElement | null = null;
function getReusableCanvas() {
  if (!reusableCanvas) reusableCanvas = document.createElement("canvas");
  return reusableCanvas;
}
