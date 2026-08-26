import type { PlatformStyle, StudioSettings } from "../types";
import { mixHex, type MarblePlatform } from "./marbleCourse";
import { instrumentSurfaceAlignment2D } from "./instrumentPlayingGeometry2D";

function gong(ctx: CanvasRenderingContext2D, platform: MarblePlatform, light: number, lowPower: boolean) {
  const radius = platform.visualCompact ? platform.width * 0.42 : Math.max(28, platform.width * 0.42);
  ctx.save();
  ctx.translate(0, instrumentSurfaceAlignment2D("gong-disc", platform.width, platform.thickness, platform.visualCompact)!.translateY);
  ctx.shadowColor = platform.color;
  ctx.shadowBlur = lowPower ? 0 : 4 + light * 30;
  const metal = ctx.createRadialGradient(-radius * 0.24, -radius * 0.28, 2, 0, 0, radius);
  metal.addColorStop(0, "#f5d790");
  metal.addColorStop(0.38, "#b58a48");
  metal.addColorStop(1, "#4b3822");
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#392b1d"; ctx.lineWidth = platform.visualCompact ? 0.8 : 5;
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = platform.color; ctx.globalAlpha = 0.18 + light * 0.82; ctx.lineWidth = platform.visualCompact ? 0.8 + light : 5 + light * 3;
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.59, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = mixHex("#c6964c", platform.color, light * 0.22);
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function flute(ctx: CanvasRenderingContext2D, platform: MarblePlatform, light: number, lowPower: boolean) {
  const half = platform.width / 2;
  const radius = platform.visualCompact ? Math.max(1.2, platform.thickness * 0.42) : Math.max(8, platform.thickness * 0.42);
  ctx.save();
  ctx.translate(0, instrumentSurfaceAlignment2D("flute-pipe", platform.width, platform.thickness, platform.visualCompact)!.translateY);
  const body = ctx.createLinearGradient(0, -radius, 0, radius);
  body.addColorStop(0, "#f4f8fb"); body.addColorStop(0.35, "#aeb8c2"); body.addColorStop(1, "#4d5965");
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.roundRect(-half, -radius, platform.width, radius * 2, radius); ctx.fill();
  ctx.shadowColor = platform.color; ctx.shadowBlur = lowPower ? 0 : light * 28;
  ctx.strokeStyle = platform.color; ctx.globalAlpha = 0.16 + light * 0.84; ctx.lineWidth = 3 + light * 2;
  ctx.beginPath(); ctx.moveTo(-half * 0.72, -radius * 0.15); ctx.lineTo(half * 0.72, -radius * 0.15); ctx.stroke();
  ctx.globalAlpha = 1;
  for (let index = 0; index < 6; index += 1) {
    const x = -half * 0.56 + index * half * 0.23;
    ctx.fillStyle = "#20262d"; ctx.beginPath(); ctx.arc(x, radius * 0.16, radius * 0.25, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawWindMetalPlatform2D(
  ctx: CanvasRenderingContext2D,
  style: PlatformStyle,
  platform: MarblePlatform,
  light: number,
  settings: StudioSettings,
  lowPower: boolean,
) {
  if (style === "gong-disc") { gong(ctx, platform, settings.impactPlatformLight ? light : 0, lowPower); return true; }
  if (style === "flute-pipe") { flute(ctx, platform, settings.impactPlatformLight ? light : 0, lowPower); return true; }
  return false;
}

export function drawInstrumentNoteLeds2D(
  ctx: CanvasRenderingContext2D,
  platform: MarblePlatform,
  colors: string[],
  light: number,
  lowPower: boolean,
) {
  const count = Math.max(1, colors.length);
  const stripWidth = platform.width * 0.68;
  const segmentWidth = stripWidth / count;
  const height = Math.max(4, platform.thickness * 0.18);
  ctx.save();
  colors.forEach((color, index) => {
    const x = -stripWidth / 2 + segmentWidth * index;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.28 + light * 0.72;
    ctx.shadowColor = color;
    ctx.shadowBlur = lowPower ? 0 : 8 + light * 34;
    ctx.fillRect(x + segmentWidth * 0.08, -height * 0.5, segmentWidth * 0.84, height);
  });
  ctx.restore();
}
