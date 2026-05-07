import type { ZaloMiniAppMakeupEventDto } from "@/lib/contracts";

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(value: Date): Date {
  const day = value.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(value, offset);
}

function endOfWeekSunday(value: Date): Date {
  return addDays(startOfWeekMonday(value), 6);
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

export function buildMonthGrid(anchor: Date): string[][] {
  const firstCell = startOfWeekMonday(startOfMonth(anchor));
  const lastCell = endOfWeekSunday(endOfMonth(anchor));
  const weeks: string[][] = [];
  let cursor = new Date(firstCell);

  while (cursor <= lastCell) {
    const week: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(toIsoDate(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function formatMonthLabel(value: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function toMonthInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseMonthInput(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

export function dayLabel(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(parsed);
}

export function dayNumber(value: string): string {
  return value.slice(8, 10);
}

export function isOutsideCurrentMonth(date: string, anchorDate: Date): boolean {
  const [yearText, monthText] = date.split("-");
  const year = Number.parseInt(yearText ?? "0", 10);
  const month = Number.parseInt(monthText ?? "0", 10);

  return year !== anchorDate.getFullYear() || month !== anchorDate.getMonth() + 1;
}

export function groupEventsByDate(
  events: ZaloMiniAppMakeupEventDto[]
): Map<string, ZaloMiniAppMakeupEventDto[]> {
  const map = new Map<string, ZaloMiniAppMakeupEventDto[]>();

  for (const event of events) {
    const bucket = map.get(event.eventDate) ?? [];
    bucket.push(event);
    map.set(event.eventDate, bucket);
  }

  for (const [date, bucket] of map) {
    map.set(
      date,
      [...bucket].sort((left, right) => {
        if (left.startAt === right.startAt) return left.createdAt.localeCompare(right.createdAt);
        return left.startAt.localeCompare(right.startAt);
      })
    );
  }

  return map;
}

export function eventRangeLabel(event: ZaloMiniAppMakeupEventDto): string {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return event.sessionSlot;
  }

  return `${formatter.format(start)}-${formatter.format(end)}`;
}
