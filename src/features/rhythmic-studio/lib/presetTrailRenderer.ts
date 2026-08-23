import type { StudioSettings } from "../types";
import type { MarblePoint } from "./marbleCourse";

type TrailPoint = MarblePoint & { age: number };

interface ScreenTrailPoint {
  x: number;
  y: number;
  age: number;
}

function offsetTrail(points: TrailPoint[], cameraY: number, offset: number): ScreenTrailPoint[] {
  return points.map((point, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const size = Math.max(1, Math.hypot(dx, dy));
    return {
      x: point.x - (dy / size) * offset,
      y: point.y - cameraY + (dx / size) * offset,
      age: point.age,
    };
  });
}

function strokeSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: ScreenTrailPoint[],
  color: string,
  width: number,
  alpha: number,
  blur: number,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) * 0.5;
    const midY = (points[i].y + points[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function drawTaperedRibbon(
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  cameraY: number,
  color: string,
  width: number,
  offset: number,
) {
  if (points.length < 2) return;
  const shifted = offsetTrail(points, cameraY, offset);
  const chunks = Math.min(11, Math.max(5, Math.floor(points.length / 10)));
  for (let chunk = 0; chunk < chunks; chunk += 1) {
    const from = Math.floor((chunk / chunks) * (shifted.length - 1));
    const to = Math.max(from + 2, Math.floor(((chunk + 1) / chunks) * shifted.length));
    const part = shifted.slice(from, Math.min(shifted.length, to + 1));
    const age = part.reduce((sum, point) => sum + point.age, 0) / Math.max(1, part.length);
    const fade = Math.pow(Math.max(0.025, 1 - age), 1.45);
    strokeSmoothPath(ctx, part, color, width * (0.28 + fade * 0.72), fade * 0.94, width * (1.5 + fade * 2.2));
  }
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let arm = 0; arm < 10; arm += 1) {
    const angle = -Math.PI / 2 + arm * Math.PI / 5;
    const r = arm % 2 ? radius * 0.38 : radius;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (arm === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, points: TrailPoint[], cameraY: number) {
  ctx.save();
  const stride = Math.max(6, Math.floor(points.length / 13));
  for (let i = stride; i < points.length - 3; i += stride) {
    const point = points[i];
    const fade = Math.pow(Math.max(0, 1 - point.age), 1.3);
    if (fade < 0.12) continue;
    const phase = i * 1.618;
    const x = point.x + Math.sin(phase) * 13;
    const y = point.y - cameraY + Math.cos(phase * 0.77) * 10;
    const radius = 3.6 + (i % 3) * 1.4;
    ctx.globalAlpha = fade * 0.92;
    ctx.fillStyle = i % 3 === 0 ? "#fff6ff" : i % 2 ? "#ff75eb" : "#8feeff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12 + radius * 1.4;
    starPath(ctx, x, y, radius);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPresetTrail(ctx: CanvasRenderingContext2D, points: TrailPoint[], cameraY: number, settings: StudioSettings) {
  if (settings.terrainProfile !== "comet" || points.length < 2) return false;

  // Nathan-style comet: a wide blue aura with distinct cyan, white and magenta ribbons.
  drawTaperedRibbon(ctx, points, cameraY, "#1a36ff", 15, 0);
  drawTaperedRibbon(ctx, points, cameraY, "#2b7dff", 8.5, -5.8);
  drawTaperedRibbon(ctx, points, cameraY, "#51edff", 4.2, -9.2);
  drawTaperedRibbon(ctx, points, cameraY, "#fb4be4", 4.4, 7.3);
  drawTaperedRibbon(ctx, points, cameraY, "#f6edff", 1.9, -1.8);
  drawStars(ctx, points, cameraY);
  return true;
}
