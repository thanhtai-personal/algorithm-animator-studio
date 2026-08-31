import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { StudioSettings } from "../types";
import { marbleHitPoint } from "./marbleCourse";

export interface LongGapRailPoint { x: number; y: number }

export function isAutomaticLongGapRail(start: MarblePlatform, end?: MarblePlatform) {
  return Boolean(end && start.longRail && start.motionMode === "roll");
}

export function longGapRailPoints(start: MarblePlatform, end: MarblePlatform, steps = 8): LongGapRailPoint[] {
  const from = marbleHitPoint(start);
  const to = marbleHitPoint(end);
  const count = Math.max(2, steps + 1);
  return Array.from({ length: count }, (_, index) => {
    const t = index / Math.max(1, count - 1);
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}

function offsetPoints(points: LongGapRailPoint[], distance: number) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const size = Math.max(0.001, Math.hypot(dx, dy));
    return { x: point.x + (-dy / size) * distance, y: point.y + (dx / size) * distance };
  });
}

function stroke(ctx: CanvasRenderingContext2D, points: LongGapRailPoint[], cameraY: number) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y - cameraY);
    else ctx.lineTo(point.x, point.y - cameraY);
  });
  ctx.stroke();
}

export function drawAutomaticLongGapRails(
  ctx: CanvasRenderingContext2D,
  platforms: MarblePlatform[],
  cameraY: number,
  settings: StudioSettings,
) {
  const halfGap = Math.max(5, settings.ballSize * 0.52);
  for (let index = 0; index < platforms.length - 1; index += 1) {
    const start = platforms[index];
    const end = platforms[index + 1];
    if (!isAutomaticLongGapRail(start, end)) continue;
    const points = longGapRailPoints(start, end, 10);
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    if (maxY < cameraY - 140 || minY > cameraY + 1440) continue;

    const left = offsetPoints(points, -halfGap);
    const right = offsetPoints(points, halfGap);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(16,18,22,.82)";
    ctx.lineWidth = 7;
    stroke(ctx, left, cameraY);
    stroke(ctx, right, cameraY);
    ctx.strokeStyle = "rgba(196,204,214,.92)";
    ctx.lineWidth = 2.5;
    stroke(ctx, left, cameraY);
    stroke(ctx, right, cameraY);
    ctx.restore();
  }
}
