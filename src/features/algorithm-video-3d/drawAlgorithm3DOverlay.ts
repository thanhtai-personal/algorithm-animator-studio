import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { eventLabel } from "./algorithm3dMath";
import { getAlgorithm3DStoryState } from "./algorithm3dStory";

export function drawAlgorithm3DOverlay(ctx: CanvasRenderingContext2D, params: {
  frame: Frame;
  frameIndex: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  code: string;
  showCode: boolean;
  complexity?: { time: string; best?: string; worst?: string; space: string };
  lang: Lang;
  theme?: Theme;
  storyMode?: boolean;
  storyHook?: boolean;
  frameCount?: number;
  transitionProgress?: number;
}) {
  const { width: w, height: h } = params;
  const portrait = h > w;
  const pad = Math.round(Math.min(w, h) * 0.036);
  const titleSize = Math.max(22, Math.round(h * (portrait ? 0.025 : 0.041)));

  ctx.save();
  if (params.storyMode) {
    drawStoryRetentionOverlay(ctx, params, pad, portrait);
    ctx.restore();
    return;
  }
  topFade(ctx, w, h);
  cornerMarks(ctx, w, h, pad);
  titleBlock(ctx, params, pad, titleSize);
  statusBlock(ctx, params, pad, titleSize);
  stateBlock(ctx, params, pad, portrait);
  if (params.showCode) drawExecutionDock(ctx, params, pad, portrait);
  ctx.restore();
}

function drawStoryRetentionOverlay(
  ctx: CanvasRenderingContext2D,
  params: Parameters<typeof drawAlgorithm3DOverlay>[1],
  pad: number,
  portrait: boolean,
) {
  const { width: w, height: h } = params;
  const frameCount = Math.max(1, params.frameCount ?? 1);
  const story = getAlgorithm3DStoryState({
    frame: params.frame,
    frameIndex: params.frameIndex,
    frameCount,
    title: params.title,
    lang: params.lang,
    hook: Boolean(params.storyHook || (params.frameIndex <= 1 && frameCount > 3)),
    transitionProgress: params.transitionProgress ?? 1,
  });
  const theme = params.theme;
  const accent = story.complete ? (theme?.sorted ?? "#22c55e") : params.frame.event === "swap" ? (theme?.swap ?? "#fb7185") : (theme?.highlight ?? "#facc15");

  const top = ctx.createLinearGradient(0, 0, 0, h * 0.27);
  top.addColorStop(0, "rgba(3,7,10,0.58)");
  top.addColorStop(1, "rgba(3,7,10,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.28);
  const bottom = ctx.createLinearGradient(0, h, 0, h * 0.72);
  bottom.addColorStop(0, "rgba(3,7,10,0.64)");
  bottom.addColorStop(1, "rgba(3,7,10,0)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.70, w, h * 0.30);

  cornerMarks(ctx, w, h, pad);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const micro = Math.max(10, h * (portrait ? 0.010 : 0.014));
  ctx.fillStyle = "rgba(255,255,255,0.46)";
  ctx.font = `900 ${micro}px ui-sans-serif,system-ui`;
  ctx.fillText("3D STORY · RETENTION", pad, pad + micro);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `750 ${micro * 1.35}px ui-sans-serif,system-ui`;
  ctx.fillText(params.title, pad, pad + micro * 2.8, w * 0.52);

  const percent = Math.round(story.progress * 100);
  drawPill(ctx, w - pad, pad * 0.88, `${percent}%`, theme?.sorted ?? "#86efac", h);

  const headlineSize = Math.max(24, h * (story.complete ? (portrait ? 0.036 : 0.052) : portrait ? 0.030 : 0.044));
  const centerY = h * (story.complete ? 0.21 : 0.16);
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = `900 ${Math.max(10, headlineSize * 0.28)}px ui-sans-serif,system-ui`;
  ctx.fillText(story.kicker, w / 2, centerY, w * 0.82);
  ctx.fillStyle = "#ffffff";
  ctx.font = `950 ${headlineSize}px ui-sans-serif,system-ui`;
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = Math.max(8, headlineSize * 0.38);
  ctx.fillText(story.headline, w / 2, centerY + headlineSize * 1.18, w * 0.88);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(244,247,248,0.62)";
  ctx.font = `650 ${Math.max(10, headlineSize * 0.34)}px ui-sans-serif,system-ui`;
  ctx.fillText(story.detail, w / 2, centerY + headlineSize * 1.76, w * 0.82);

  const barX = pad;
  const barW = w - pad * 2;
  const barH = Math.max(6, h * 0.006);
  const barY = h - pad - barH;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = `850 ${Math.max(9, micro * 0.82)}px ui-sans-serif,system-ui`;
  ctx.fillText(params.lang === "vi" ? "TIẾN ĐỘ KHÔI PHỤC" : "CITY RESTORATION", barX, barY - micro * 0.66);
  ctx.textAlign = "right";
  ctx.fillText(`${story.completed}/${Math.max(1, params.frame.arr.length)} ${params.lang === "vi" ? "ĐÃ KHÓA" : "LOCKED"}`, barX + barW, barY - micro * 0.66);
  roundedRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();
  const progressW = Math.max(barH, barW * Math.max(0.02, story.progress));
  const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  gradient.addColorStop(0, theme?.highlight ?? "#facc15");
  gradient.addColorStop(1, theme?.sorted ?? "#22c55e");
  roundedRect(ctx, barX, barY, progressW, barH, barH / 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.textBaseline = "alphabetic";
}

function titleBlock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, titleSize: number) {
  const { width: w, height: h } = params;
  ctx.fillStyle = "#67e8f9";
  ctx.fillRect(pad, pad, Math.max(2, h * 0.002), titleSize * 1.65);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.54)";
  ctx.font = `900 ${Math.max(10, titleSize * 0.27)}px ui-sans-serif,system-ui`;
  ctx.fillText("DATA CONSTRUCTION · 3D", pad + titleSize * 0.30, pad + titleSize * 0.34);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${titleSize}px ui-sans-serif,system-ui`;
  ctx.fillText(params.title, pad + titleSize * 0.30, pad + titleSize * 1.08, w * 0.56);
  if (params.subtitle) {
    ctx.fillStyle = "rgba(235,241,244,0.62)";
    ctx.font = `600 ${Math.max(11, titleSize * 0.36)}px ui-sans-serif,system-ui`;
    ctx.fillText(params.subtitle, pad + titleSize * 0.30, pad + titleSize * 1.55, w * 0.48);
  }
}

function statusBlock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, titleSize: number) {
  const { width: w, height: h } = params;
  const swap = params.frame.event === "swap";
  drawPill(ctx, w - pad, pad + titleSize * 0.08, `${eventLabel(params.frame)} · ${String(params.frameIndex + 1).padStart(3, "0")}`, swap ? "#fb7185" : "#67e8f9", h);
  if (!params.complexity) return;
  drawPill(ctx, w - pad, pad + titleSize * 0.75, `T ${params.complexity.time}`, "#fde68a", h);
  drawPill(ctx, w - pad, pad + titleSize * 1.34, `S ${params.complexity.space}`, "#86efac", h);
}

function stateBlock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, portrait: boolean) {
  const { width: w, height: h } = params;
  const vars = Object.entries(params.frame.vars).slice(0, 5).map(([k, v]) => `${k}=${v}`).join("   ");
  const text = vars || (params.lang === "vi" ? "Đang khởi tạo…" : "Initializing…");
  const font = Math.max(10, h * 0.0125);
  const codeDockH = params.showCode ? h * (portrait ? 0.13 : 0.14) : 0;
  const y = h - pad - codeDockH;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font = `900 ${font * 0.75}px ui-sans-serif,system-ui`;
  ctx.fillText(`STATE · ${String(params.frameIndex + 1).padStart(3, "0")}`, pad, y - font * 1.6);
  ctx.font = `650 ${font}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  const maxWidth = portrait ? w * 0.78 : w * 0.42;
  const textWidth = Math.min(maxWidth, ctx.measureText(text).width + font * 1.8);
  softPanel(ctx, pad, y - font * 1.28, textWidth, font * 1.5, Math.max(6, font * 0.36), 0.56);
  ctx.fillStyle = "rgba(241,245,249,0.76)";
  ctx.fillText(text, pad + font * 0.8, y - font * 0.30, textWidth - font * 1.6);
}

function drawExecutionDock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, portrait: boolean) {
  const { width: w, height: h, code, frame } = params;
  const panelW = portrait ? w - pad * 2 : w * 0.58;
  const panelH = h * (portrait ? 0.12 : 0.13);
  const x = (w - panelW) / 2;
  const y = h - pad - panelH;
  softPanel(ctx, x, y, panelW, panelH, Math.max(10, h * 0.009), 0.76);

  const font = Math.max(10, Math.round(h * (portrait ? 0.010 : 0.0125)));
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = `900 ${font * 0.78}px ui-sans-serif,system-ui`;
  ctx.fillText(params.lang === "vi" ? "LỆNH ĐANG CHẠY" : "EXECUTING", x + font * 1.05, y + font * 1.25);
  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  ctx.arc(x + font * 0.52, y + font * 1.05, Math.max(2, font * 0.13), 0, Math.PI * 2);
  ctx.fill();

  const lines = code.split("\n");
  const visibleCount = portrait ? 2 : 3;
  const start = Math.max(0, Math.min(lines.length - 1, frame.line - 2));
  ctx.font = `650 ${font}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  lines.slice(start, start + visibleCount).forEach((line, offset) => {
    const lineNo = start + offset + 1;
    const yy = y + font * 2.35 + offset * font * 1.35;
    const active = lineNo === frame.line;
    if (active) {
      ctx.fillStyle = "rgba(255,255,255,0.065)";
      roundedRect(ctx, x + font * 0.46, yy - font * 0.9, panelW - font * 0.92, font * 1.16, 5);
      ctx.fill();
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(x + font * 0.46, yy - font * 0.88, Math.max(2, font * 0.11), font * 1.08);
    }
    ctx.fillStyle = active ? "rgba(248,250,252,0.94)" : "rgba(203,213,225,0.44)";
    ctx.fillText(`${String(lineNo).padStart(2, "0")}  ${line}`, x + font * 0.9, yy, panelW - font * 1.6);
  });
}

function topFade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  gradient.addColorStop(0, "rgba(4,9,12,0.42)");
  gradient.addColorStop(1, "rgba(4,9,12,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h * 0.24);
}

function drawPill(ctx: CanvasRenderingContext2D, right: number, y: number, text: string, color: string, height: number) {
  const font = Math.max(10, height * 0.0122);
  ctx.font = `850 ${font}px ui-sans-serif,system-ui`;
  const width = ctx.measureText(text).width + font * 1.7;
  const pillH = font * 1.68;
  const x = right - width;
  softPanel(ctx, x, y, width, pillH, pillH * 0.34, 0.54);
  ctx.strokeStyle = alpha(color, 0.42);
  ctx.lineWidth = 1.1;
  roundedRect(ctx, x, y, width, pillH, pillH * 0.34);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + width / 2, y + pillH / 2 + 0.5);
  ctx.textBaseline = "alphabetic";
}

function softPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, opacity = 0.62) {
  roundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = `rgba(4,10,14,${opacity})`;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

function cornerMarks(ctx: CanvasRenderingContext2D, w: number, h: number, pad: number) {
  const size = Math.max(10, Math.min(w, h) * 0.013);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.001);
  const points = [
    [pad * 0.55, pad * 0.55, 1, 1], [w - pad * 0.55, pad * 0.55, -1, 1],
    [pad * 0.55, h - pad * 0.55, 1, -1], [w - pad * 0.55, h - pad * 0.55, -1, -1],
  ] as const;
  points.forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * size, y);
    ctx.stroke();
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
}

function alpha(color: string, value: number) {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${value})`;
  }
  return color;
}
