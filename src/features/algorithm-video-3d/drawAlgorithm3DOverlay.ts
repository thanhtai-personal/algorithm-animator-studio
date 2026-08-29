import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import { eventLabel } from "./algorithm3dMath";

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
}) {
  const { width: w, height: h } = params;
  const portrait = h > w;
  const pad = Math.round(Math.min(w, h) * 0.038);
  const titleSize = Math.max(24, Math.round(h * (portrait ? 0.026 : 0.043)));

  ctx.save();
  cinematicFade(ctx, w, h);
  cornerMarks(ctx, w, h, pad);
  titleBlock(ctx, params, pad, titleSize);
  statusBlock(ctx, params, pad, titleSize);
  stateBlock(ctx, params, pad, portrait);
  if (params.showCode) drawCode(ctx, params, pad, portrait);
  ctx.restore();
}

function titleBlock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, titleSize: number) {
  const { width: w, height: h } = params;
  const x = pad;
  const y = pad;
  const accent = "#67e8f9";
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, Math.max(2, h * 0.0022), titleSize * 1.85);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.font = `900 ${Math.max(11, titleSize * 0.29)}px ui-sans-serif,system-ui`;
  ctx.fillText("ALGORITHM VISUALIZATION · 3D", x + titleSize * 0.32, y + titleSize * 0.38);

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${titleSize}px ui-sans-serif,system-ui`;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 14;
  ctx.fillText(params.title, x + titleSize * 0.32, y + titleSize * 1.18, w * 0.58);
  ctx.shadowBlur = 0;

  if (params.subtitle) {
    ctx.fillStyle = "rgba(226,232,240,0.62)";
    ctx.font = `600 ${Math.max(12, titleSize * 0.38)}px ui-sans-serif,system-ui`;
    ctx.fillText(params.subtitle, x + titleSize * 0.32, y + titleSize * 1.68, w * 0.5);
  }
}

function statusBlock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, titleSize: number) {
  const { width: w, height: h } = params;
  const status = `${eventLabel(params.frame)} · ${String(params.frameIndex + 1).padStart(3, "0")}`;
  drawPill(ctx, w - pad, pad + titleSize * 0.1, status, "#67e8f9", h);
  if (!params.complexity) return;
  drawPill(ctx, w - pad, pad + titleSize * 0.82, `T ${params.complexity.time}`, "#fde68a", h);
  drawPill(ctx, w - pad, pad + titleSize * 1.44, `S ${params.complexity.space}`, "#86efac", h);
}

function stateBlock(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, portrait: boolean) {
  const { width: w, height: h } = params;
  const vars = Object.entries(params.frame.vars).slice(0, 6).map(([k, v]) => `${k}=${v}`).join("   ");
  const text = vars || (params.lang === "vi" ? "Đang khởi tạo trạng thái…" : "Initializing state…");
  const font = Math.max(12, h * 0.014);
  const maxWidth = params.showCode && !portrait ? w * 0.48 : w * 0.76;
  const y = h - pad;

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font = `900 ${font * 0.82}px ui-sans-serif,system-ui`;
  ctx.fillText(`STATE · ${String(params.frameIndex + 1).padStart(3, "0")}`, pad, y - font * 2.25);

  ctx.font = `700 ${font}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  const textWidth = Math.min(maxWidth, ctx.measureText(text).width + font * 2.2);
  softPanel(ctx, pad, y - font * 1.75, textWidth, font * 1.75, Math.max(8, font * 0.45));
  ctx.fillStyle = "rgba(241,245,249,0.76)";
  ctx.fillText(text, pad + font, y - font * 0.62, textWidth - font * 2);
}

function drawCode(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, portrait: boolean) {
  const { width: w, height: h, code, frame } = params;
  const x = portrait ? pad : w * 0.64;
  const y = portrait ? h * 0.67 : h * 0.30;
  const panelW = portrait ? w - pad * 2 : w - x - pad;
  const panelH = portrait ? h * 0.22 : h * 0.59;
  softPanel(ctx, x, y, panelW, panelH, Math.max(14, h * 0.012));

  const font = Math.max(11, Math.round(h * (portrait ? 0.0115 : 0.0155)));
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = `900 ${font * 0.9}px ui-sans-serif,system-ui`;
  ctx.fillText(params.lang === "vi" ? "MÃ ĐANG THỰC THI" : "EXECUTION TRACE", x + font * 1.35, y + font * 1.7);

  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  ctx.arc(x + font * 0.72, y + font * 1.45, Math.max(2, font * 0.16), 0, Math.PI * 2);
  ctx.fill();

  const lines = code.split("\n");
  const maxLines = Math.max(4, Math.floor((panelH - font * 3.2) / (font * 1.48)));
  const start = Math.max(0, Math.min(lines.length - 1, frame.line - 3));
  ctx.font = `650 ${font}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  lines.slice(start, start + maxLines).forEach((line, offset) => {
    const lineNo = start + offset + 1;
    const yy = y + font * 3.1 + offset * font * 1.48;
    const active = lineNo === frame.line;
    if (active) {
      ctx.fillStyle = "rgba(255,255,255,0.055)";
      roundedRect(ctx, x + font * 0.65, yy - font * 0.93, panelW - font * 1.3, font * 1.26, 6);
      ctx.fill();
      ctx.fillStyle = "#67e8f9";
      ctx.fillRect(x + font * 0.65, yy - font * 0.91, Math.max(2, font * 0.13), font * 1.18);
    }
    ctx.fillStyle = active ? "rgba(248,250,252,0.96)" : "rgba(203,213,225,0.48)";
    ctx.fillText(`${String(lineNo).padStart(2, "0")}  ${line}`, x + font * 1.15, yy, panelW - font * 2.1);
  });
}

function cinematicFade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.32);
  top.addColorStop(0, "rgba(2,6,23,0.42)");
  top.addColorStop(1, "rgba(2,6,23,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.34);

  const bottom = ctx.createLinearGradient(0, h * 0.62, 0, h);
  bottom.addColorStop(0, "rgba(2,6,23,0)");
  bottom.addColorStop(1, "rgba(2,6,23,0.46)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  const vignette = ctx.createRadialGradient(w / 2, h * 0.44, Math.min(w, h) * 0.28, w / 2, h * 0.46, Math.max(w, h) * 0.74);
  vignette.addColorStop(0, "rgba(2,6,23,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawPill(ctx: CanvasRenderingContext2D, right: number, y: number, text: string, color: string, height: number) {
  const font = Math.max(11, height * 0.0128);
  ctx.font = `850 ${font}px ui-sans-serif,system-ui`;
  const width = ctx.measureText(text).width + font * 1.9;
  const pillH = font * 1.82;
  const x = right - width;
  softPanel(ctx, x, y, width, pillH, pillH * 0.36, 0.58);
  ctx.strokeStyle = alpha(color, 0.42);
  ctx.lineWidth = 1.2;
  roundedRect(ctx, x, y, width, pillH, pillH * 0.36);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + width / 2, y + pillH / 2 + 0.5);
  ctx.textBaseline = "alphabetic";
}

function softPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, opacity = 0.66) {
  roundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = `rgba(3,7,18,${opacity})`;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function cornerMarks(ctx: CanvasRenderingContext2D, w: number, h: number, pad: number) {
  const size = Math.max(11, Math.min(w, h) * 0.014);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0012);
  const points = [
    [pad * 0.55, pad * 0.55, 1, 1],
    [w - pad * 0.55, pad * 0.55, -1, 1],
    [pad * 0.55, h - pad * 0.55, 1, -1],
    [w - pad * 0.55, h - pad * 0.55, -1, -1],
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
