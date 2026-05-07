import type { CalendarEventType, CalendarViewMode } from "@/types/calendarModule";

export const CALENDAR_FEATURE_KEY = "calendar";

export const CALENDAR_VIEW_MODES: CalendarViewMode[] = ["month", "week", "day"];

export const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  "pickup",
  "return",
  "booking",
  "overdue",
];
