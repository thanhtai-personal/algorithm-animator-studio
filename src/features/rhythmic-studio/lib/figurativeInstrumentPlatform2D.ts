import type { PlatformStyle } from "../types";
import { mixHex, type MarblePlatform } from "./marbleCourse";
import { instrumentSurfaceAlignment2D } from "./instrumentPlayingGeometry2D";

function trumpet(ctx: CanvasRenderingContext2D, platform: MarblePlatform, light: number, lowPower: boolean) {
  const width = platform.width;
  const radius = platform.visualCompact ? width * 0.2 : Math.max(14, width * 0.2);
  ctx.save();
  ctx.translate(0, instrumentSurfaceAlignment2D("trumpet-horn", width, platform.thickness, platform.visualCompact)!.translateY);
  ctx.shadowColor = platform.color;
  ctx.shadowBlur = lowPower ? 0 : light * 24;
  const brass = ctx.createLinearGradient(0, -radius, 0, radius);
  brass.addColorStop(0, "#fff1a6"); brass.addColorStop(0.45, "#d6a62f"); brass.addColorStop(1, "#825815");
  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.moveTo(width * 0.08, -radius * 0.28);
  ctx.lineTo(width * 0.48, -radius);
  ctx.lineTo(width * 0.48, radius);
  ctx.lineTo(width * 0.08, radius * 0.28);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(-width * 0.44, -radius * 0.18, width * 0.56, radius * 0.36);
  ctx.strokeStyle = mixHex("#e3b43d", platform.color, light * 0.25);
  ctx.lineWidth = Math.max(2, radius * 0.13);
  ctx.beginPath(); ctx.moveTo(-width * 0.3, radius * 0.12); ctx.lineTo(width * 0.14, radius * 0.12); ctx.stroke();
  for (let index = 0; index < 3; index += 1) {
    const x = -width * 0.14 + index * width * 0.11;
    ctx.fillStyle = "#f3d36e"; ctx.fillRect(x, -radius * 0.56, width * 0.035, radius * 0.55);
  }
  ctx.restore();
}

function guitar(ctx: CanvasRenderingContext2D, platform: MarblePlatform, light: number, lowPower: boolean) {
  const width = platform.width;
  const radius = platform.visualCompact ? width * 0.28 : Math.max(18, width * 0.28);
  ctx.save();
  ctx.translate(0, instrumentSurfaceAlignment2D("guitar-body", width, platform.thickness, platform.visualCompact)!.translateY);
  ctx.shadowColor = platform.color;
  ctx.shadowBlur = lowPower ? 0 : light * 20;
  const wood = ctx.createRadialGradient(-width * 0.2, -radius * 0.28, 2, -width * 0.12, 0, radius * 1.4);
  wood.addColorStop(0, "#efb266"); wood.addColorStop(0.55, "#ad642d"); wood.addColorStop(1, "#603018");
  ctx.fillStyle = wood;
  ctx.beginPath(); ctx.ellipse(-width * 0.2, radius * 0.08, width * 0.25, radius * 0.9, -0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(width * 0.02, -radius * 0.02, width * 0.19, radius * 0.68, 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#70401f"; ctx.fillRect(width * 0.08, -radius * 0.16, width * 0.39, radius * 0.32);
  ctx.fillStyle = "#24130b"; ctx.beginPath(); ctx.arc(-width * 0.1, 0, radius * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#f8e6b7"; ctx.lineWidth = 1;
  for (const offset of [-0.08, 0, 0.08]) {
    ctx.beginPath(); ctx.moveTo(-width * 0.28, radius * offset); ctx.lineTo(width * 0.47, radius * offset); ctx.stroke();
  }
  ctx.restore();
}

function bronzeDrum(ctx: CanvasRenderingContext2D, platform: MarblePlatform, light: number, lowPower: boolean) {
  const width = platform.width;
  const radius = platform.visualCompact ? width * 0.4 : Math.max(28, width * 0.4);
  ctx.save();
  ctx.translate(0, instrumentSurfaceAlignment2D("bronze-drum", width, platform.thickness, platform.visualCompact)!.translateY);
  ctx.shadowColor = platform.color;
  ctx.shadowBlur = lowPower ? 0 : light * 26;
  const bronze = ctx.createRadialGradient(-radius * 0.24, -radius * 0.28, 2, 0, 0, radius);
  bronze.addColorStop(0, "#f1cc68"); bronze.addColorStop(0.5, "#a87828"); bronze.addColorStop(1, "#4e3515");
  ctx.fillStyle = bronze; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#513716"; ctx.lineWidth = Math.max(1.2, radius * 0.045);
  for (const ratio of [0.38, 0.62, 0.84]) { ctx.beginPath(); ctx.arc(0, 0, radius * ratio, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = mixHex("#e9bb4d", platform.color, light * 0.22);
  ctx.beginPath();
  for (let point = 0; point < 16; point += 1) {
    const angle = -Math.PI / 2 + point * Math.PI / 8;
    const starRadius = radius * (point % 2 === 0 ? 0.3 : 0.12);
    const x = Math.cos(angle) * starRadius;
    const y = Math.sin(angle) * starRadius;
    if (point === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawFigurativeInstrument2D(
  ctx: CanvasRenderingContext2D,
  style: PlatformStyle,
  platform: MarblePlatform,
  light: number,
  lowPower: boolean,
) {
  if (style === "trumpet-horn") { trumpet(ctx, platform, light, lowPower); return true; }
  if (style === "guitar-body") { guitar(ctx, platform, light, lowPower); return true; }
  if (style === "bronze-drum") { bronzeDrum(ctx, platform, light, lowPower); return true; }
  return false;
}
