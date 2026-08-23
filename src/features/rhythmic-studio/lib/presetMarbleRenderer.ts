import type { StudioSettings } from "../types";
import { mixHex, type MarblePoint } from "./marbleCourse";

function groundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha = 0.32) {
  ctx.save();
  ctx.fillStyle = `rgba(8,10,16,${alpha})`;
  ctx.filter = "blur(5px)";
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.75, y + radius * 1.05, radius * 1.28, radius * 0.48, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCandyMarble(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, settings: StudioSettings, spin: number) {
  groundShadow(ctx, x, y, radius, 0.36);
  ctx.save();
  ctx.shadowColor = settings.ballBaseColor;
  ctx.shadowBlur = 7 + pulse * 9;
  const sphere = ctx.createRadialGradient(x - radius * 0.36, y - radius * 0.42, radius * 0.08, x, y, radius);
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.18, mixHex(settings.ballBaseColor, "#ffffff", 0.22));
  sphere.addColorStop(0.7, settings.ballBaseColor);
  sphere.addColorStop(1, mixHex(settings.ballBaseColor, "#2b0807", 0.48));
  ctx.fillStyle = sphere;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = settings.ballStripeColor;
  ctx.fillRect(-radius * 1.4, -radius * 0.24, radius * 2.8, radius * 0.48);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(20,14,13,.72)";
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); ctx.arc(x - radius * 0.28, y - radius * 0.34, radius * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGalaxyMarble(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, settings: StudioSettings) {
  ctx.save();
  ctx.shadowColor = settings.prismEnd;
  ctx.shadowBlur = 24 + pulse * 28;
  const sphere = ctx.createRadialGradient(x - radius * 0.38, y - radius * 0.42, radius * 0.08, x, y, radius);
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.2, "#78ecff");
  sphere.addColorStop(0.52, "#6b55ff");
  sphere.addColorStop(0.78, "#eb4bc8");
  sphere.addColorStop(1, "#21103d");
  ctx.fillStyle = sphere;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.clip();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = Math.max(1.2, radius * 0.12);
  ctx.beginPath(); ctx.ellipse(x - radius * 0.05, y, radius * 0.9, radius * 0.34, -0.4, 0.2, Math.PI * 1.55); ctx.stroke();
  ctx.strokeStyle = "rgba(56,218,255,.7)";
  ctx.beginPath(); ctx.ellipse(x + radius * 0.06, y + radius * 0.08, radius * 0.75, radius * 0.27, 0.7, 0, Math.PI * 1.65); ctx.stroke();
  ctx.restore();
}

function drawInstrumentMarble(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, spin: number) {
  groundShadow(ctx, x, y, radius, 0.28);
  ctx.save();
  ctx.shadowColor = "rgba(90,185,255,.58)";
  ctx.shadowBlur = 8 + pulse * 10;
  const sphere = ctx.createRadialGradient(x - radius * 0.36, y - radius * 0.42, radius * 0.08, x, y, radius);
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.2, "#b9efff");
  sphere.addColorStop(0.48, "#465b78");
  sphere.addColorStop(0.76, "#22263a");
  sphere.addColorStop(1, "#10131e");
  ctx.fillStyle = sphere;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(spin * 0.72);
  for (const [color, offset] of [["#ff4f69", -0.52], ["#ffd34e", -0.12], ["#44dbff", 0.26], ["#8d67ff", 0.56]] as const) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.76;
    ctx.lineWidth = Math.max(2, radius * 0.24);
    ctx.beginPath();
    ctx.arc(0, offset * radius, radius * 0.78, Math.PI * 0.06, Math.PI * 0.94);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.66)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.62)";
  ctx.beginPath(); ctx.ellipse(x - radius * 0.3, y - radius * 0.34, radius * 0.22, radius * 0.14, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawPresetMarble(
  ctx: CanvasRenderingContext2D,
  point: MarblePoint,
  cameraY: number,
  pulse: number,
  settings: StudioSettings,
) {
  const x = point.x;
  const y = point.y - cameraY;
  const radius = settings.ballSize * (1 + pulse * 0.06);
  const spin = point.x * 0.026 + point.y * 0.018;
  if (settings.terrainProfile === "tube-board") { drawCandyMarble(ctx, x, y, radius, pulse, settings, spin); return true; }
  if (settings.terrainProfile === "comet") { drawGalaxyMarble(ctx, x, y, radius, pulse, settings); return true; }
  if (settings.terrainProfile === "xylophone") { drawInstrumentMarble(ctx, x, y, radius, pulse, spin); return true; }
  return false;
}
