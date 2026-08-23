import type { StudioSettings } from "../types";
import { mixHex, type MarblePoint } from "./marbleCourse";

function groundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha = 0.32) {
  ctx.save();
  const sx = x - radius * 0.75;
  const sy = y + radius * 1.05;
  ctx.translate(sx, sy);
  ctx.rotate(-0.18);
  ctx.scale(1, 0.38);
  const shadow = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.45);
  shadow.addColorStop(0, `rgba(8,10,16,${alpha})`);
  shadow.addColorStop(0.64, `rgba(8,10,16,${alpha * 0.5})`);
  shadow.addColorStop(1, "rgba(8,10,16,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2); ctx.fill();
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
  const aura = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.9);
  aura.addColorStop(0, `rgba(255,88,222,${0.34 + pulse * 0.2})`);
  aura.addColorStop(0.42, `rgba(83,103,255,${0.16 + pulse * 0.12})`);
  aura.addColorStop(1, "rgba(40,30,100,0)");
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(x, y, radius * 2.9, 0, Math.PI * 2); ctx.fill();

  ctx.shadowColor = settings.prismEnd;
  ctx.shadowBlur = 27 + pulse * 32;
  const sphere = ctx.createRadialGradient(x - radius * 0.34, y - radius * 0.42, radius * 0.07, x, y, radius);
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.14, "#ffc8ff");
  sphere.addColorStop(0.34, "#e84ad4");
  sphere.addColorStop(0.58, "#8256ff");
  sphere.addColorStop(0.78, "#2f55cb");
  sphere.addColorStop(1, "#180d35");
  ctx.fillStyle = sphere;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.clip();

  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = "rgba(255,219,255,.9)";
  ctx.lineWidth = Math.max(1.3, radius * 0.13);
  ctx.beginPath(); ctx.ellipse(x - radius * 0.08, y - radius * 0.02, radius * 0.88, radius * 0.3, -0.5, 0.08, Math.PI * 1.62); ctx.stroke();
  ctx.strokeStyle = "rgba(78,221,255,.72)";
  ctx.lineWidth = Math.max(1, radius * 0.085);
  ctx.beginPath(); ctx.ellipse(x + radius * 0.08, y + radius * 0.1, radius * 0.74, radius * 0.24, 0.72, 0, Math.PI * 1.68); ctx.stroke();

  for (let i = 0; i < 7; i += 1) {
    const angle = i * 2.399 + radius * 0.03;
    const rr = radius * (0.24 + (i % 4) * 0.13);
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,.84)" : "rgba(142,237,255,.78)";
    ctx.beginPath(); ctx.arc(x + Math.cos(angle) * rr, y + Math.sin(angle) * rr, 0.7 + (i % 3) * 0.35, 0, Math.PI * 2); ctx.fill();
  }
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
