import type { PlatformStyle, StudioSettings } from "../types";
import { mixHex, type MarblePlatform } from "./marbleCourse";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawTubeCylinder(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const h = Math.max(20, p.thickness);
  const cap = h * 0.5;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.52)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = -11;
  ctx.shadowOffsetY = 17;
  roundedRect(ctx, -half, 0, p.width, h, cap);
  ctx.fillStyle = "rgba(10,12,15,.82)";
  ctx.fill();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10 + settings.platformGlow * 13 + impact * 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const body = ctx.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, mixHex(p.color, "#ffffff", 0.34));
  body.addColorStop(0.26, p.color);
  body.addColorStop(0.72, mixHex(p.color, "#11131a", 0.28));
  body.addColorStop(1, mixHex(p.color, "#050608", 0.48));
  roundedRect(ctx, -half, 0, p.width, h, cap);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(8,8,9,.94)";
  ctx.lineWidth = 2.3;
  ctx.stroke();
  const frontX = half - cap;
  const front = ctx.createRadialGradient(frontX - cap * 0.25, h * 0.34, 1, frontX, h * 0.5, cap);
  front.addColorStop(0, mixHex(p.color, "#ffffff", 0.5));
  front.addColorStop(0.72, p.color);
  front.addColorStop(1, mixHex(p.color, "#0b0b0c", 0.34));
  ctx.fillStyle = front;
  ctx.beginPath();
  ctx.arc(frontX, h * 0.5, cap - 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#111114";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.34)";
  ctx.beginPath();
  ctx.ellipse(-half * 0.22, h * 0.22, Math.max(7, p.width * 0.16), 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCometPad(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const h = Math.max(10, p.thickness);
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 20 + settings.platformGlow * 24 + impact * 18;
  ctx.fillStyle = `${p.color}45`;
  roundedRect(ctx, -half, 0, p.width, h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = mixHex(p.color, "#ffffff", 0.32);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = `${p.color}8a`;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-half + 7, h + 4, p.width - 14, 5);
  ctx.restore();
}

function drawXylophoneKey(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, settings: StudioSettings) {
  const h = Math.max(13, p.thickness);
  ctx.save();
  ctx.shadowColor = "rgba(30,35,42,.30)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 6;
  roundedRect(ctx, -half, 0, p.width, h, 4);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(38,43,50,.72)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const shine = ctx.createLinearGradient(0, 0, 0, h);
  shine.addColorStop(0, "rgba(255,255,255,.42)");
  shine.addColorStop(0.34, "rgba(255,255,255,.10)");
  shine.addColorStop(1, "rgba(0,0,0,.10)");
  roundedRect(ctx, -half + 2, 2, p.width - 4, h - 4, 3);
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.restore();
}

export function drawPresetPlatform(
  ctx: CanvasRenderingContext2D,
  style: PlatformStyle,
  half: number,
  platform: MarblePlatform,
  impact: number,
  settings: StudioSettings,
) {
  if (style === "tube-cylinder") { drawTubeCylinder(ctx, half, platform, impact, settings); return true; }
  if (style === "comet-pad") { drawCometPad(ctx, half, platform, impact, settings); return true; }
  if (style === "xylophone-key") { drawXylophoneKey(ctx, half, platform, settings); return true; }
  return false;
}
