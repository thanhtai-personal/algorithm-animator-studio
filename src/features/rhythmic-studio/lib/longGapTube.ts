import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import { overrideForSegment } from "./courseGuide";
import {
  LONG_GAP_TUBE_MS,
  longGapTubeGeometry,
  longGapTubePoint,
  mixHex,
  type LongGapTubeGeometry,
  type MarblePlatform,
} from "./marbleCourse";

interface SamplePoint {
  x: number;
  y: number;
}

function sampleTube(geometry: LongGapTubeGeometry, cameraY: number, steps = 34): SamplePoint[] {
  const points: SamplePoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const point = longGapTubePoint(geometry, i / steps);
    points.push({ x: point.x, y: point.y - cameraY });
  }
  return points;
}

function strokePath(ctx: CanvasRenderingContext2D, points: SamplePoint[]) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
}

function offsetSamples(points: SamplePoint[], distance: number) {
  return points.map((point, index) => {
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    return { x: point.x + (-dy / length) * distance, y: point.y + (dx / length) * distance };
  });
}

function drawGlassTube(
  ctx: CanvasRenderingContext2D,
  geometry: LongGapTubeGeometry,
  cameraY: number,
  color: string,
  glow: number,
  timeMs: number,
) {
  const points = sampleTube(geometry, cameraY);
  const tubeWidth = 32;
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  if (maxY < -120 || minY > 1400) return;

  const breathe = 0.84 + Math.sin(timeMs / 780 + geometry.entryY * 0.004) * 0.08;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.shadowColor = color;
  ctx.shadowBlur = 26 + glow * 20;
  ctx.strokeStyle = `${color}26`;
  ctx.lineWidth = tubeWidth + 14;
  strokePath(ctx, points);

  ctx.shadowBlur = 10 + glow * 10;
  ctx.strokeStyle = `rgba(190,230,255,${0.13 * breathe})`;
  ctx.lineWidth = tubeWidth;
  strokePath(ctx, points);

  ctx.shadowBlur = 0;
  const brightEdge = offsetSamples(points, -tubeWidth * 0.34);
  const neonEdge = offsetSamples(points, tubeWidth * 0.34);
  ctx.strokeStyle = `rgba(255,255,255,${0.44 * breathe})`;
  ctx.lineWidth = 2.2;
  strokePath(ctx, brightEdge);
  ctx.strokeStyle = `${color}8f`;
  ctx.lineWidth = 3.2;
  strokePath(ctx, neonEdge);

  const highlight = offsetSamples(points, -tubeWidth * 0.16);
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 1.1;
  strokePath(ctx, highlight);

  ctx.strokeStyle = "rgba(255,255,255,.13)";
  ctx.lineWidth = 1;
  for (let i = 4; i < points.length - 3; i += 5) {
    const prev = points[i - 1];
    const next = points[i + 1];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / length;
    const ny = dx / length;
    const point = points[i];
    ctx.beginPath();
    ctx.moveTo(point.x + nx * tubeWidth * 0.31, point.y + ny * tubeWidth * 0.31);
    ctx.lineTo(point.x - nx * tubeWidth * 0.31, point.y - ny * tubeWidth * 0.31);
    ctx.stroke();
  }

  for (const point of [points[0], points[points.length - 1]]) {
    ctx.strokeStyle = mixHex(color, "#ffffff", 0.34);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, tubeWidth * 0.48, 0, Math.PI * 2);
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
  overrides: CourseItemOverride[] = [],
) {
  if (settings.terrainProfile === "comet") return;
  for (let index = 0; index < platforms.length - 1; index += 1) {
    const span = events[index + 1].timeMs - events[index].timeMs;
    if (span < LONG_GAP_TUBE_MS || overrideForSegment(index, overrides)) continue;
    const start = platforms[index];
    const end = platforms[index + 1];
    const geometry = longGapTubeGeometry(start, end, settings);
    const color = mixHex(start.color, end.color, 0.5);
    drawGlassTube(ctx, geometry, cameraY, color, settings.platformGlow, timeMs);
  }
}
