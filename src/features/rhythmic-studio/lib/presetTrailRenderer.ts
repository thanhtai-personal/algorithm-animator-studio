import type { StudioSettings } from "../types";
import type { MarblePoint } from "./marbleCourse";

type TrailPoint = MarblePoint & { age: number };

function ribbonSegment(
  ctx: CanvasRenderingContext2D,
  a: TrailPoint,
  b: TrailPoint,
  cameraY: number,
  color: string,
  baseWidth: number,
  offset: number,
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const size = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / size;
  const ny = dx / size;
  const fade = Math.max(0.03, 1 - (a.age + b.age) * 0.5);
  ctx.save();
  ctx.globalAlpha = fade * 0.88;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = baseWidth * (1.4 + fade * 1.8);
  ctx.lineCap = "round";
  ctx.lineWidth = baseWidth * (0.38 + fade * 0.62);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * offset, a.y - cameraY + ny * offset);
  ctx.lineTo(b.x + nx * offset, b.y - cameraY + ny * offset);
  ctx.stroke();
  ctx.restore();
}

function drawRibbon(ctx: CanvasRenderingContext2D, points: TrailPoint[], cameraY: number, color: string, width: number, offset: number) {
  for (let index = 1; index < points.length; index += 1) {
    ribbonSegment(ctx, points[index - 1], points[index], cameraY, color, width, offset);
  }
}

function drawStars(ctx: CanvasRenderingContext2D, points: TrailPoint[], cameraY: number) {
  ctx.save();
  for (let i = 5; i < points.length; i += 7) {
    const point = points[i];
    const fade = Math.max(0, 1 - point.age);
    if (fade < 0.18) continue;
    const x = point.x + (i % 2 ? 8 : -7);
    const y = point.y - cameraY + ((i % 3) - 1) * 5;
    ctx.globalAlpha = fade * 0.82;
    ctx.fillStyle = i % 2 ? "#ff79ea" : "#9beeff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let arm = 0; arm < 8; arm += 1) {
      const angle = arm * Math.PI / 4;
      const radius = arm % 2 ? 1.3 : 4;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (arm === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawPresetTrail(ctx: CanvasRenderingContext2D, points: TrailPoint[], cameraY: number, settings: StudioSettings) {
  if (settings.terrainProfile !== "comet" || points.length < 2) return false;
  drawRibbon(ctx, points, cameraY, "#345dff", 9, 0);
  drawRibbon(ctx, points, cameraY, "#36e4ff", 3.1, -4.5);
  drawRibbon(ctx, points, cameraY, "#ec4bff", 2.8, 4.5);
  drawStars(ctx, points, cameraY);
  return true;
}
