import { COMPLEXITY, type Frame } from "./algorithms";
import type { Lang } from "./i18n";
import { renderKineticTypography } from "./kineticTypographyRenderer";
import type { LongContentScene } from "./longContentTimeline";
import type { LongVideoType } from "./longVideoTypes";
import type { Theme } from "./renderer";
import { renderFrame } from "./renderer";
import { roundRect } from "./renderers/shapes";

const W = 1920;
const H = 1080;

type Params = {
  frame?: Frame | null;
  previousFrame?: Frame | null;
  scene: LongContentScene;
  sceneProgress: number;
  timelineProgress: number;
  algoId: string;
  algoName: string;
  code: string;
  lang: Lang;
  theme: Theme;
  showCode: boolean;
  frameLabel: string;
  frameTransitionProgress?: number;
  longVideoType: LongVideoType;
};

export function renderStyledLongContentFrame(ctx: CanvasRenderingContext2D, params: Params) {
  if (params.longVideoType === "kinetic-typography") return renderKineticTypography(ctx, params);
  if (params.longVideoType === "animated-explainer") return renderAnimatedExplainer(ctx, params);
  renderUiKineticExplainer(ctx, params);
}

function renderAnimatedExplainer(ctx: CanvasRenderingContext2D, params: Params) {
  drawSoftBackground(ctx, "#f8fafc", "#dcfce7");
  const characterX = 250 + easeOutCubic(params.sceneProgress) * 110;
  drawPresenter(ctx, characterX, 690, params.sceneProgress);
  drawSpeechBubble(ctx, params);
  drawIconOrbit(ctx, 1420, 450, params);
  if (params.frame) drawMiniAlgorithmStrip(ctx, params, 610, 710, 850, 150);
  drawScenePills(ctx, params);
}

function renderUiKineticExplainer(ctx: CanvasRenderingContext2D, params: Params) {
  drawSoftBackground(ctx, "#07111f", "#13283d");
  drawBrowserChrome(ctx, 150, 120, 1620, 820);
  drawSidebar(ctx, params);
  drawDashboardHeader(ctx, params);
  if (params.frame) drawEmbeddedAlgorithm(ctx, params);
  drawInspector(ctx, params);
}

function drawSoftBackground(ctx: CanvasRenderingContext2D, from: string, to: string) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, from);
  bg.addColorStop(1, to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}

function drawPresenter(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(x, y - 180, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#38bdf8";
  roundRect(ctx, x - 82, y - 105, 164, 190, 42);
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x + 74, y - 54);
  ctx.quadraticCurveTo(x + 190, y - 140 + Math.sin(progress * Math.PI * 4) * 20, x + 300, y - 94);
  ctx.stroke();
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(x - 24, y - 190, 8, 0, Math.PI * 2);
  ctx.arc(x + 24, y - 190, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, params: Params) {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(15,23,42,0.12)";
  ctx.lineWidth = 3;
  roundRect(ctx, 520, 150, 850, 350, 34);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  drawFittedCenterText(ctx, params.scene.title, 945, 250, 54, 34, 760);
  ctx.fillStyle = "rgba(15,23,42,0.68)";
  ctx.font = "700 29px ui-sans-serif, system-ui, sans-serif";
  drawWrappedCenterText(ctx, params.scene.subtitle, 945, 326, 720, 40, 3);
}

function drawIconOrbit(ctx: CanvasRenderingContext2D, cx: number, cy: number, params: Params) {
  const icons = ["key", "sort", "O(n)", "data"];
  icons.forEach((icon, index) => {
    const angle = params.timelineProgress * Math.PI * 2 + index * Math.PI / 2;
    const x = cx + Math.cos(angle) * 150;
    const y = cy + Math.sin(angle) * 100;
    ctx.fillStyle = index === 0 ? "#4ade80" : "#ffffff";
    roundRect(ctx, x - 68, y - 42, 136, 84, 26);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 26px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(icon, x, y + 10);
  });
}

function drawScenePills(ctx: CanvasRenderingContext2D, params: Params) {
  params.scene.bullets.slice(0, 3).forEach((bullet, index) => {
    const x = 610 + index * 330;
    ctx.fillStyle = index === 0 ? "#0f172a" : "rgba(255,255,255,0.72)";
    roundRect(ctx, x, 900, 290, 70, 24);
    ctx.fill();
    ctx.fillStyle = index === 0 ? "#ffffff" : "#0f172a";
    ctx.font = "800 21px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(shorten(bullet, 28), x + 145, 944);
  });
}

function drawBrowserChrome(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, x, y, w, h, 26);
  ctx.fill();
  ctx.fillStyle = "#e5e7eb";
  roundRect(ctx, x, y, w, 74, 26);
  ctx.fill();
  ["#ef4444", "#f59e0b", "#22c55e"].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 42 + index * 34, y + 36, 10, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x + 180, y + 20, 860, 34, 17);
  ctx.fill();
}

function drawSidebar(ctx: CanvasRenderingContext2D, params: Params) {
  ctx.fillStyle = "#0f172a";
  roundRect(ctx, 170, 214, 310, 706, 24);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(params.algoName, 204, 270);
  params.scene.bullets.slice(0, 5).forEach((bullet, index) => {
    ctx.fillStyle = index === 0 ? "#4ade80" : "rgba(255,255,255,0.62)";
    ctx.font = "700 20px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(shorten(bullet, 24), 204, 334 + index * 54);
  });
}

function drawDashboardHeader(ctx: CanvasRenderingContext2D, params: Params) {
  ctx.fillStyle = "#111827";
  ctx.font = "950 46px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(params.scene.title, 540, 250);
  ctx.fillStyle = "rgba(17,24,39,0.62)";
  ctx.font = "700 25px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(shorten(params.scene.subtitle, 80), 540, 292);
}

function drawEmbeddedAlgorithm(ctx: CanvasRenderingContext2D, params: Params) {
  const canvas = getCanvas();
  canvas.width = 860;
  canvas.height = 484;
  const inner = canvas.getContext("2d");
  if (!inner || !params.frame) return;
  renderFrame(inner, params.frame, {
    title: params.algoName,
    subtitle: params.scene.kindLabel,
    theme: params.theme,
    code: params.code,
    showCode: params.showCode,
    lang: params.lang,
    complexity: COMPLEXITY[params.algoId],
    previousFrame: params.previousFrame,
    transitionProgress: params.frameTransitionProgress ?? params.sceneProgress,
    algorithmId: params.algoId,
  }, canvas.width, canvas.height);
  ctx.save();
  roundRect(ctx, 540, 340, 860, 484, 24);
  ctx.clip();
  ctx.drawImage(canvas, 540, 340);
  ctx.restore();
}

function drawInspector(ctx: CanvasRenderingContext2D, params: Params) {
  ctx.fillStyle = "#f1f5f9";
  roundRect(ctx, 1430, 340, 300, 484, 24);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 26px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Inspector", 1462, 390);
  const rows = [
    ["Scene", params.scene.kindLabel],
    ["Progress", `${Math.round(params.sceneProgress * 100)}%`],
    ["Time", params.frameLabel.split("·").at(-1)?.trim() ?? ""],
  ];
  rows.forEach(([key, value], index) => {
    ctx.fillStyle = "rgba(15,23,42,0.52)";
    ctx.font = "700 18px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(key, 1462, 450 + index * 74);
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 25px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(shorten(value, 18), 1462, 482 + index * 74);
  });
  drawProgress(ctx, 1462, 760, 230, 16, params.timelineProgress, "#22c55e");
}

function drawMiniAlgorithmStrip(ctx: CanvasRenderingContext2D, params: Params, x: number, y: number, w: number, h: number) {
  const arr = params.frame?.arr ?? [];
  const cell = w / Math.max(1, arr.length);
  arr.forEach((value, index) => {
    const height = Math.max(18, (value / Math.max(...arr, 1)) * h);
    ctx.fillStyle = params.frame?.highlight.includes(index) ? "#4ade80" : params.frame?.sorted.includes(index) ? "#a7f3d0" : "#0f172a";
    roundRect(ctx, x + index * cell + 4, y + h - height, cell - 8, height, 10);
    ctx.fill();
  });
}

function drawProgress(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, fill: string) {
  ctx.fillStyle = "rgba(15,23,42,0.16)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, Math.max(h, w * clamp01(value)), h, h / 2);
  ctx.fill();
}

function drawFittedCenterText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, start: number, min: number, maxW: number) {
  let size = start;
  ctx.textAlign = "center";
  while (size > min) {
    ctx.font = `950 ${size}px ui-sans-serif, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 2;
  }
  ctx.fillText(text, cx, y);
}

function drawWrappedCenterText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lineH: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  text.split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxW || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, index) => ctx.fillText(shorten(item, 70), cx, y + index * lineH));
}

function shorten(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}...`;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

let reusableCanvas: HTMLCanvasElement | null = null;
function getCanvas() {
  if (!reusableCanvas) reusableCanvas = document.createElement("canvas");
  return reusableCanvas;
}
