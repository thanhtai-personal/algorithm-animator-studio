import { COMPLEXITY, Frame } from "./algorithms";
import type { AnimalColumnSettings } from "./animalColumns";
import { LongContentScene } from "./longContentTimeline";
import { renderFrame, Theme } from "./renderer";
import { roundRect, shade } from "./renderers/shapes";

const W = 1920;
const H = 1080;

type RenderLongContentParams = {
  frame: Frame;
  previousFrame?: Frame | null;
  scene: LongContentScene;
  sceneProgress: number;
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
  drawBackground(ctx, theme);
  drawBrand(ctx, params.channelName ?? "Code Visual Lab");
  drawLeftScriptPanel(ctx, params);
  drawAnimationPanel(ctx, params);
  drawBottomBar(ctx, scene, sceneProgress, timelineProgress, params.frameLabel);
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

function drawLeftScriptPanel(ctx: CanvasRenderingContext2D, params: RenderLongContentParams) {
  const panel = { x: 70, y: 150, w: 650, h: 780 };
  ctx.fillStyle = "rgba(15,23,42,0.68)";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 28);
  ctx.fill();
  ctx.stroke();

  const { scene, theme } = params;
  ctx.textAlign = "left";
  ctx.fillStyle = theme.highlight;
  ctx.font = "800 32px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(scene.kind.toUpperCase(), panel.x + 38, panel.y + 58);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px ui-sans-serif, system-ui, sans-serif";
  wrapText(ctx, scene.title, panel.x + 38, panel.y + 130, panel.w - 76, 66, 2);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "500 30px ui-sans-serif, system-ui, sans-serif";
  const subtitleY = panel.y + (scene.title.length > 28 ? 270 : 220);
  wrapText(ctx, scene.subtitle, panel.x + 38, subtitleY, panel.w - 76, 40, 3);

  const bulletStartY = subtitleY + 170;
  ctx.font = "600 29px ui-sans-serif, system-ui, sans-serif";
  scene.bullets.slice(0, 5).forEach((bullet, index) => {
    const y = bulletStartY + index * 92;
    ctx.fillStyle = index === 0 ? theme.highlight : "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(panel.x + 48, y - 9, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    wrapText(ctx, bullet, panel.x + 70, y, panel.w - 115, 34, 2);
  });
}

function drawAnimationPanel(ctx: CanvasRenderingContext2D, params: RenderLongContentParams) {
  const x = 770;
  const y = 120;
  const w = 1080;
  const h = 730;
  ctx.fillStyle = "rgba(2,6,23,0.72)";
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 34);
  ctx.fill();
  ctx.stroke();

  const innerPad = 26;
  const animCanvas = getReusableCanvas();
  animCanvas.width = 1280;
  animCanvas.height = 720;
  const animCtx = animCanvas.getContext("2d");
  if (!animCtx) return;

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = next;
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((ln, index) => ctx.fillText(ln, x, y + index * lineHeight));
}

let reusableCanvas: HTMLCanvasElement | null = null;
function getReusableCanvas() {
  if (!reusableCanvas) reusableCanvas = document.createElement("canvas");
  return reusableCanvas;
}
