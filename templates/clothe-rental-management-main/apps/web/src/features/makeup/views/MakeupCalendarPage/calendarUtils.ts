import type { AppLocale } from "@/constants/locale";
import type { MakeupEventDto } from "@/types/makeupModule";

export const MAX_EVENT_IN_CELL = 3;
const EVENT_CHIP_COLOR_CLASSNAMES = [
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-200",
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200",
  "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/15 dark:text-violet-200",
] as const;

export function dayLabel(value: string, locale: AppLocale): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
  }).format(parsed);
}

export function dayNumber(date: string): string {
  return date.slice(8, 10);
}

export function isOutsideCurrentMonth(date: string, anchorDate: Date): boolean {
  const [yearText, monthText] = date.split("-");
  const year = Number.parseInt(yearText ?? "0", 10);
  const month = Number.parseInt(monthText ?? "0", 10);
  return year !== anchorDate.getFullYear() || month !== anchorDate.getMonth() + 1;
}

export function eventRangeLabel(event: MakeupEventDto, locale: AppLocale): string {
  const formatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
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

export function eventChipClassName(event: MakeupEventDto, index: number): string {
  if (event.isConflictWarning) {
    return "border border-warning/40 bg-warning/15 text-warning";
  }

  return EVENT_CHIP_COLOR_CLASSNAMES[index % EVENT_CHIP_COLOR_CLASSNAMES.length];
}

export function eventNoteLabel(event: MakeupEventDto): string {
  const note = event.note?.trim();
  if (!note) return "-";
  return note;
}
