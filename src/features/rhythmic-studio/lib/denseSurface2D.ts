import { denseSurfaceSegments } from "../engine/denseSurfaceGeometry";
import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import type { StudioSettings } from "../types";

function strokeSegment(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  offset: number,
) {
  const length = Math.max(0.001, Math.hypot(toX - fromX, toY - fromY));
  const normalX = -(toY - fromY) / length;
  const normalY = (toX - fromX) / length;
  ctx.beginPath();
  ctx.moveTo(fromX + normalX * offset, fromY + normalY * offset);
  ctx.lineTo(toX + normalX * offset, toY + normalY * offset);
  ctx.stroke();
}

export function drawDenseSurfaces2D(
  ctx: CanvasRenderingContext2D,
  platforms: MarblePlatform[],
  cameraY: number,
  settings: StudioSettings,
) {
  const railGap = Math.max(4, settings.ballSize * 0.34);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const segment of denseSurfaceSegments(platforms)) {
    const fromY = segment.fromY - cameraY;
    const toY = segment.toY - cameraY;
    if (segment.layout !== "parallel-rails") continue;
    if (Math.max(fromY, toY) < -100 || Math.min(fromY, toY) > ctx.canvas.height + 100) continue;
    ctx.strokeStyle = "rgba(19, 31, 42, .86)";
    ctx.lineWidth = 7;
    ctx.shadowBlur = 0;
    strokeSegment(ctx, segment.fromX, fromY, segment.toX, toY, 0);
    ctx.strokeStyle = "#67f5ff";
    ctx.lineWidth = 2.8;
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12;
    strokeSegment(ctx, segment.fromX, fromY, segment.toX, toY, -railGap);
    strokeSegment(ctx, segment.fromX, fromY, segment.toX, toY, railGap);
  }
  ctx.restore();
}
