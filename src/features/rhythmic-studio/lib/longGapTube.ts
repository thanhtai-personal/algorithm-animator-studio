import type { NoteEvent, StudioSettings } from "../types";
import {
  LONG_GAP_TUBE_MS,
  longGapTubeGeometry,
  mixHex,
  type MarblePlatform,
} from "./marbleCourse";

function drawTubeSegment(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string,
  glow: number,
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const tubeWidth = 30;

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 24 + glow * 18;

  ctx.strokeStyle = `${color}2e`;
  ctx.lineWidth = tubeWidth + 12;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.shadowBlur = 8 + glow * 10;
  ctx.strokeStyle = "rgba(195,235,255,.18)";
  ctx.lineWidth = tubeWidth;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  for (const side of [-1, 1]) {
    const offset = side * tubeWidth * 0.34;
    ctx.strokeStyle = side < 0 ? "rgba(255,255,255,.42)" : `${color}88`;
    ctx.lineWidth = side < 0 ? 2.2 : 3.2;
    ctx.beginPath();
    ctx.moveTo(startX + nx * offset, startY + ny * offset);
    ctx.lineTo(endX + nx * offset, endY + ny * offset);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 1;
  const rings = Math.max(3, Math.floor(length / 115));
  for (let i = 1; i < rings; i += 1) {
    const t = i / rings;
    const cx = startX + dx * t;
    const cy = startY + dy * t;
    ctx.beginPath();
    ctx.moveTo(cx + nx * tubeWidth * 0.31, cy + ny * tubeWidth * 0.31);
    ctx.lineTo(cx - nx * tubeWidth * 0.31, cy - ny * tubeWidth * 0.31);
    ctx.stroke();
  }

  for (const [x, y] of [[startX, startY], [endX, endY]] as const) {
    ctx.strokeStyle = mixHex(color, "#ffffff", 0.34);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, tubeWidth * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLongGapTubes(
  ctx: CanvasRenderingContext2D,
  platforms: MarblePlatform[],
  events: NoteEvent[],
  cameraY: number,
  timeMs: number,
  settings: StudioSettings,
) {
  for (let index = 0; index < platforms.length - 1; index += 1) {
    const span = events[index + 1].timeMs - events[index].timeMs;
    if (span < LONG_GAP_TUBE_MS) continue;
    const startTime = events[index].timeMs;
    const endTime = events[index + 1].timeMs;
    if (timeMs < startTime - 400 || timeMs > endTime + 300) continue;

    const start = platforms[index];
    const end = platforms[index + 1];
    const geometry = longGapTubeGeometry(start, end, settings);
    const y1 = geometry.entryY - cameraY;
    const y2 = geometry.exitY - cameraY;
    if (Math.max(y1, y2) < -90 || Math.min(y1, y2) > 1370) continue;

    const color = mixHex(start.color, end.color, 0.5);
    const progress = Math.max(0, Math.min(1, (timeMs - startTime) / span));
    const activeGlow = progress > 0.16 && progress < 0.84 ? 1 : 0.45;
    drawTubeSegment(ctx, geometry.entryX, y1, geometry.exitX, y2, color, settings.platformGlow * activeGlow);
  }
}
