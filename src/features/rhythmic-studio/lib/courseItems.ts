import type { CourseItemOverride, CourseItemStyle, CourseLongItem, PlatformStyle, StudioSettings } from "../types";
import { PLATFORM_STYLES } from "../types";
import { clamp, mixHex, type MarblePlatform } from "./marbleCourse";
import { guidedCoursePoint, isLongCourseItem } from "./courseGuide";

const platformSet = new Set<CourseItemStyle>(PLATFORM_STYLES);

export function isPlatformCourseItem(style: CourseItemStyle): style is PlatformStyle {
  return platformSet.has(style);
}

export function overrideForNode(index: number, overrides: CourseItemOverride[]) {
  return overrides.find((override) => index >= override.startIndex && index < override.startIndex + override.span);
}

type Point = { x: number; y: number };

function sampleSegment(start: MarblePlatform, end: MarblePlatform, style: CourseLongItem, settings: StudioSettings, cameraY: number, steps = 18): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const point = guidedCoursePoint(start, end, i / steps, style, settings) ?? {
      x: start.x + (end.x - start.x) * (i / steps),
      y: start.y + (end.y - start.y) * (i / steps) - settings.ballSize,
    };
    points.push({ x: point.x, y: point.y - cameraY });
  }
  return points;
}

function strokePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.stroke();
}

function drawGlassPath(ctx: CanvasRenderingContext2D, points: Point[], color: string, width: number, mode: "tube" | "channel" | "acrylic") {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = mode === "acrylic" ? 12 : 22;
  ctx.strokeStyle = mode === "channel" ? "rgba(150,205,255,.13)" : mode === "acrylic" ? "rgba(225,245,255,.18)" : "rgba(185,225,255,.11)";
  ctx.lineWidth = width;
  strokePath(ctx, points);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.42)";
  ctx.lineWidth = 2.1;
  strokePath(ctx, points);
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = mode === "channel" ? 4 : 2.8;
  ctx.setLineDash(mode === "channel" ? [18, 9] : []);
  strokePath(ctx, points);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawNeonBridge(ctx: CanvasRenderingContext2D, points: Point[], color: string) {
  ctx.save();
  ctx.lineCap = "round";
  for (const offset of [-8, 8]) {
    ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.strokeStyle = color; ctx.lineWidth = 3.5;
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y + offset) : ctx.moveTo(point.x, point.y + offset));
    ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 1.2;
  for (let i = 2; i < points.length - 2; i += 3) {
    ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y - 8); ctx.lineTo(points[i].x, points[i].y + 8); ctx.stroke();
  }
  ctx.restore();
}

function drawStairFlight(ctx: CanvasRenderingContext2D, start: MarblePlatform, end: MarblePlatform, cameraY: number, color: string) {
  const steps = 7;
  ctx.save();
  for (let i = 0; i < steps; i += 1) {
    const t = i / Math.max(1, steps - 1);
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t - cameraY;
    const width = 44;
    ctx.fillStyle = "rgba(10,15,27,.9)"; ctx.strokeStyle = `${color}77`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(x - width / 2, y - 4, width, 11, 4); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function singleLongItem(ctx: CanvasRenderingContext2D, platform: MarblePlatform, cameraY: number, style: CourseLongItem, settings: StudioSettings) {
  const fakeEnd = { ...platform, x: platform.x + Math.min(140, platform.width * 0.5), y: platform.y + 26 };
  if (style === "stair-flight") return drawStairFlight(ctx, platform, fakeEnd, cameraY, platform.color);
  const points = sampleSegment(platform, fakeEnd, style, settings, cameraY, 14);
  if (style === "neon-bridge") drawNeonBridge(ctx, points, platform.color);
  else drawGlassPath(ctx, points, platform.color, style === "glass-channel" ? 38 : 32, style === "acrylic-pipe" ? "acrylic" : style === "glass-channel" ? "channel" : "tube");
}

export function drawCourseLongItems(ctx: CanvasRenderingContext2D, platforms: MarblePlatform[], overrides: CourseItemOverride[], cameraY: number, settings: StudioSettings) {
  for (const override of overrides) {
    if (!isLongCourseItem(override.style)) continue;
    const startIndex = clamp(override.startIndex, 0, Math.max(0, platforms.length - 1));
    const endIndex = clamp(override.startIndex + override.span - 1, startIndex, Math.max(0, platforms.length - 1));
    if (startIndex === endIndex) { singleLongItem(ctx, platforms[startIndex], cameraY, override.style, settings); continue; }
    for (let index = startIndex; index < endIndex; index += 1) {
      const start = platforms[index]; const end = platforms[index + 1];
      const color = mixHex(start.color, end.color, 0.5);
      if (override.style === "stair-flight") { drawStairFlight(ctx, start, end, cameraY, color); continue; }
      const points = sampleSegment(start, end, override.style, settings, cameraY);
      if (override.style === "neon-bridge") drawNeonBridge(ctx, points, color);
      else drawGlassPath(ctx, points, color, override.style === "glass-channel" ? 40 : 32, override.style === "acrylic-pipe" ? "acrylic" : override.style === "glass-channel" ? "channel" : "tube");
    }
  }
}
