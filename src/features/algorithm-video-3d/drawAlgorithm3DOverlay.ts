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
  const pad = Math.round(Math.min(w, h) * 0.035);
  const titleSize = Math.max(24, Math.round(h * (portrait ? 0.028 : 0.046)));
  ctx.save();
  vignette(ctx, w, h);
  glass(ctx, pad, pad, portrait ? w * 0.65 : w * 0.54, titleSize * 2.35, 18);
  ctx.textAlign = "left";
  ctx.fillStyle = "#a5f3fc";
  ctx.font = `800 ${Math.max(13, titleSize * 0.34)}px ui-sans-serif,system-ui`;
  ctx.fillText("WEBGL 3D", pad * 1.55, pad + titleSize * 0.55);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${titleSize}px ui-sans-serif,system-ui`;
  ctx.fillText(params.title, pad * 1.55, pad + titleSize * 1.45, w * 0.5);
  if (params.subtitle) {
    ctx.fillStyle = "rgba(226,232,240,0.82)";
    ctx.font = `500 ${Math.max(13, titleSize * 0.42)}px ui-sans-serif,system-ui`;
    ctx.fillText(params.subtitle, pad * 1.55, pad + titleSize * 2.03, w * 0.5);
  }

  const status = `${eventLabel(params.frame)}  ·  #${params.frameIndex + 1}`;
  pill(ctx, w - pad, pad + titleSize * 0.45, status, "#67e8f9", true, h);
  if (params.complexity) pill(ctx, w - pad, pad + titleSize * 1.02, `TIME ${params.complexity.time}`, "#fde047", true, h);
  if (params.complexity) pill(ctx, w - pad, pad + titleSize * 1.59, `MEM ${params.complexity.space}`, "#86efac", true, h);

  const vars = Object.entries(params.frame.vars).slice(0, 6).map(([k, v]) => `${k}=${v}`).join("   ");
  const bottomH = Math.max(50, h * 0.055);
  glass(ctx, pad, h - pad - bottomH, params.showCode && !portrait ? w * 0.53 : w - pad * 2, bottomH, 14);
  ctx.fillStyle = "#d1fae5";
  ctx.font = `700 ${Math.max(12, h * 0.016)}px ui-monospace,monospace`;
  ctx.fillText(vars || (params.lang === "vi" ? "Đang khởi tạo trạng thái..." : "Initializing state..."), pad * 1.45, h - pad - bottomH * 0.42, params.showCode && !portrait ? w * 0.5 : w - pad * 3);

  if (params.showCode) drawCode(ctx, params, pad, portrait);
  ctx.restore();
}

function drawCode(ctx: CanvasRenderingContext2D, params: Parameters<typeof drawAlgorithm3DOverlay>[1], pad: number, portrait: boolean) {
  const { width: w, height: h, code, frame } = params;
  const x = portrait ? pad : w * 0.61;
  const y = portrait ? h * 0.67 : h * 0.29;
  const panelW = portrait ? w - pad * 2 : w - x - pad;
  const panelH = portrait ? h * 0.22 : h * 0.61;
  glass(ctx, x, y, panelW, panelH, 18);
  const font = Math.max(11, Math.round(h * (portrait ? 0.012 : 0.017)));
  ctx.font = `600 ${font}px ui-monospace,monospace`;
  ctx.textAlign = "left";
  const lines = code.split("\n");
  const maxLines = Math.max(4, Math.floor((panelH - font * 3) / (font * 1.5)));
  const start = Math.max(0, Math.min(lines.length - 1, frame.line - 3));
  ctx.fillStyle = "#a5f3fc";
  ctx.font = `800 ${font}px ui-sans-serif,system-ui`;
  ctx.fillText(params.lang === "vi" ? "MÃ ĐANG CHẠY" : "LIVE CODE", x + font * 1.2, y + font * 1.7);
  ctx.font = `600 ${font}px ui-monospace,monospace`;
  lines.slice(start, start + maxLines).forEach((line, offset) => {
    const lineNo = start + offset + 1;
    const yy = y + font * 3 + offset * font * 1.5;
    if (lineNo === frame.line) {
      ctx.fillStyle = "rgba(34,211,238,0.16)";
      roundRect(ctx, x + font * 0.7, yy - font * 0.9, panelW - font * 1.4, font * 1.25, 6);
      ctx.fill();
    }
    ctx.fillStyle = lineNo === frame.line ? "#cffafe" : "rgba(203,213,225,0.78)";
    ctx.fillText(`${String(lineNo).padStart(2, "0")}  ${line}`, x + font, yy, panelW - font * 2);
  });
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.2, w / 2, h * 0.45, Math.max(w, h) * 0.72);
  g.addColorStop(0, "rgba(2,6,23,0)");
  g.addColorStop(1, "rgba(2,6,23,0.48)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function glass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  ctx.fillStyle = "rgba(2,6,23,0.66)";
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill(); ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, right: number, y: number, text: string, color: string, alignRight: boolean, height: number) {
  const font = Math.max(12, height * 0.0135);
  ctx.font = `800 ${font}px ui-sans-serif,system-ui`;
  const tw = ctx.measureText(text).width;
  const w = tw + font * 1.8;
  const h = font * 1.7;
  const x = alignRight ? right - w : right;
  ctx.fillStyle = "rgba(2,6,23,0.68)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
  ctx.textBaseline = "alphabetic";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
