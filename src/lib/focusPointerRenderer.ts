import { Frame } from "./algorithms";
import { LongContentScene } from "./longContentTimeline";
import type { Theme } from "./renderer";
import { roundRect } from "./renderers/shapes";

type FocusPointerParams = {
  frame?: Frame | null;
  previousFrame?: Frame | null;
  scene: LongContentScene;
  sceneProgress: number;
  theme: Theme;
  showCode: boolean;
  textPanel?: { x: number; y: number; w: number; h: number };
  chartReveal?: number;
};

export function drawFocusPointer(ctx: CanvasRenderingContext2D, params: FocusPointerParams) {
  const focus = getFocusPoint(params);
  const pulse = 0.5 + 0.5 * Math.sin(params.sceneProgress * Math.PI * 8);
  const x = focus.x + Math.sin(params.sceneProgress * Math.PI * 2) * 5;
  const y = focus.y + Math.cos(params.sceneProgress * Math.PI * 2) * 4;

  ctx.save();
  ctx.strokeStyle = params.theme.highlight;
  ctx.fillStyle = params.theme.highlight;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.26 + pulse * 0.14;
  ctx.beginPath();
  ctx.arc(x, y, 18 + pulse * 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.09;
  ctx.beginPath();
  ctx.arc(x, y, 38 + pulse * 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawPointerIcon(ctx, x + 10, y + 8, params.theme.highlight);
  if (focus.label) drawFocusLabel(ctx, focus.label, x + 34, y - 46, params.theme);
  ctx.restore();
}

function getFocusPoint(params: FocusPointerParams) {
  const { scene, sceneProgress, frame, showCode } = params;
  if (!scene.animation || !frame) return getScriptPanelFocus(sceneProgress, scene.bullets.length, scene.kindLabel, params.textPanel);

  const panel = { x: 770, y: 120, w: 1080, h: 730 };
  const inner = { x: panel.x + 26, y: panel.y + 26, w: panel.w - 52, h: panel.h - 52 };
  const anim = { w: 1280, h: 720 };
  const padding = Math.round(Math.min(anim.w, anim.h) * 0.04);
  const headerH = Math.round(anim.h * 0.14);
  const codeH = showCode ? Math.floor(anim.h * 0.45) : 0;
  const chartTop = headerH;
  const chartBottom = anim.h - codeH - padding;
  const chartW = anim.w - padding * 2;
  const chartH = chartBottom - chartTop;
  const targetIndices = frame.swap.length ? frame.swap : frame.highlight.length ? frame.highlight : frame.sorted.slice(-2);

  if (frame.arr?.length && targetIndices.length) {
    const averageIndex = targetIndices.reduce((sum, index) => sum + index, 0) / targetIndices.length;
    const progressX = frame.arr.length <= 1 ? 0.5 : averageIndex / (frame.arr.length - 1);
    const localX = padding + progressX * chartW;
    const localY = chartTop + chartH * (frame.swap.length ? 0.42 : 0.5);
    return {
      x: inner.x + (localX / anim.w) * inner.w,
      y: inner.y + (localY / anim.h) * inner.h,
      label: getFrameFocusLabel(frame, params.previousFrame),
    };
  }

  return { x: inner.x + inner.w * (0.28 + 0.48 * sceneProgress), y: inner.y + inner.h * 0.48, label: scene.kindLabel };
}

function getScriptPanelFocus(sceneProgress: number, bulletCount: number, fallback: string, textPanel?: { x: number; y: number; w: number; h: number }) {
  const panel = textPanel ?? { x: 62, y: 132, w: 690, h: 820 };
  const maxBullet = Math.max(0, Math.min(4, bulletCount - 1));
  const bulletIndex = Math.min(maxBullet, Math.floor(sceneProgress * Math.max(1, bulletCount)));
  if (sceneProgress < 0.3 || bulletCount === 0) return { x: panel.x + 112, y: panel.y + 185, label: fallback };
  return { x: panel.x + 96, y: panel.y + Math.min(panel.h - 120, 410 + bulletIndex * 78), label: "Ý chính" };
}

function getFrameFocusLabel(frame: Frame, previousFrame?: Frame | null) {
  if (frame.event === "swap" || frame.swap.length) {
    const pair = frame.swap.length >= 2 ? frame.swap : frame.highlight;
    const [a, b] = pair;
    const before = previousFrame?.arr ?? frame.arr;
    if (a != null && b != null && before[a] != null && before[b] != null) {
      return `${before[a]} > ${before[b]} nên đổi chỗ`;
    }
    return "Sai thứ tự nên đổi chỗ";
  }

  if (frame.event === "compare" || frame.highlight.length) {
    const [a, b] = frame.highlight;
    if (a != null && b != null && frame.arr[a] != null && frame.arr[b] != null) {
      const relation = frame.arr[a] > frame.arr[b] ? "sẽ cần đổi chỗ" : "đúng thứ tự, giữ nguyên";
      return `So sánh ${frame.arr[a]} và ${frame.arr[b]}: ${relation}`;
    }
    return "So sánh cặp đang được tô sáng";
  }

  if (frame.event === "done") return "Mảng đã hoàn tất";
  if (frame.sorted.length) return "Vùng xanh đã đúng vị trí";
  return "Theo dõi bước này";
}

function drawPointerIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(0, 24);
  ctx.lineTo(11, 13);
  ctx.lineTo(20, 34);
  ctx.lineTo(30, 29);
  ctx.lineTo(21, 9);
  ctx.lineTo(35, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFocusLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, theme: Theme) {
  ctx.save();
  ctx.font = "800 20px ui-sans-serif, system-ui, sans-serif";
  const lines = wrapLabel(ctx, text, 330);
  const w = Math.min(370, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 34);
  const h = 28 + lines.length * 26;
  const safeX = Math.min(1810 - w, Math.max(80, x));
  const safeY = Math.min(1010 - h, Math.max(145, y));
  ctx.fillStyle = "rgba(15,23,42,0.86)";
  ctx.strokeStyle = theme.highlight;
  ctx.lineWidth = 2;
  roundRect(ctx, safeX, safeY, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  lines.forEach((line, index) => ctx.fillText(line, safeX + 17, safeY + 28 + index * 26));
  ctx.restore();
}

function wrapLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}
