import { COURSE_LONG_ITEMS, type CourseItemOverride, type CourseItemStyle, type CourseLongItem, type StudioSettings } from "../types";

export interface CourseGuideNode { x: number; y: number }

const LONG_ITEMS = new Set<CourseItemStyle>(COURSE_LONG_ITEMS);

export function isLongCourseItem(style: CourseItemStyle): style is CourseLongItem {
  return LONG_ITEMS.has(style);
}

export function overrideForSegment(index: number, overrides: CourseItemOverride[]) {
  return overrides.find((override) => isLongCourseItem(override.style) && index >= override.startIndex && index < override.startIndex + Math.max(0, override.span - 1));
}

export function guidedCoursePoint(start: CourseGuideNode, end: CourseGuideNode, t: number, style: CourseLongItem, settings: StudioSettings) {
  const p = Math.min(1, Math.max(0, t));
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const direction = dx >= 0 ? 1 : -1;
  const wave = 4 * p * (1 - p);
  const baseX = start.x + dx * p;
  const baseY = start.y + dy * p - settings.ballSize;
  if (style === "glass-tube") return { x: baseX + wave * direction * Math.min(44, Math.abs(dy) * 0.13), y: baseY + Math.sin(p * Math.PI * 2) * 10 * wave };
  if (style === "glass-channel") return { x: baseX + wave * direction * 20, y: baseY + wave * 18 };
  if (style === "acrylic-pipe") return { x: baseX + Math.sin(p * Math.PI) * direction * 24, y: baseY + Math.sin(p * Math.PI * 2) * 6 };
  if (style === "neon-bridge") return { x: baseX, y: baseY - Math.sin(Math.PI * p) * 9 };
  return null;
}
