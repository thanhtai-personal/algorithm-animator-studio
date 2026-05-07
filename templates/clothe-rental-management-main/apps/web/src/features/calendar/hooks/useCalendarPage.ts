"use client";

import { useMemo, useState } from "react";
import {
  ITEM_STATUS_LABEL_KEYS,
  ORDER_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import type { AppLocale } from "@/constants/locale";
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_VIEW_MODES,
} from "@/features/calendar/constants";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCalendarEventsQuery,
  useCalendarQuickReturnMutation,
} from "@/features/calendar/queries/useCalendarQueries";
import { calendarStore } from "@/features/calendar/stores/calendarStore";
import type {
  CalendarEventDto,
  CalendarEventType,
  CalendarViewMode,
} from "@/types/calendarModule";
import { buildDomainLabels } from "@/utils/domainLabels";

interface CalendarCopy {
  title: string;
  subtitle: string;
  viewModeLabel: string;
  prevPeriodAction: string;
  nextPeriodAction: string;
  todayAction: string;
  visibleEventsLabel: string;
  selectedDayTitle: string;
  viewModes: Record<CalendarViewMode, string>;
  filtersTitle: string;
  filters: Record<CalendarEventType, string>;
  remindersTitle: string;
  overdueRemindersTitle: string;
  stuckItemsTitle: string;
  stuckThresholdPrefix: string;
  noReminders: string;
  noOverdueReminders: string;
  noStuckItems: string;
  quickViewTitle: string;
  quickViewEmpty: string;
  openOrderAction: string;
  returnAction: string;
  actionFailed: string;
  loading: string;
  errorFallback: string;
  retryAction: string;
  dayHeaders: string[];
  eventsEmpty: string;
  overDueBadge: string;
}

const CALENDAR_COPY: Record<AppLocale, CalendarCopy> = {
  vi: {
    title: "Lịch vận hành",
    subtitle: "Theo dõi pickups, returns, bookings và quá hạn theo chi nhánh hiện tại.",
    viewModeLabel: "Chế độ xem",
    prevPeriodAction: "Kỳ trước",
    nextPeriodAction: "Kỳ sau",
    todayAction: "Hôm nay",
    visibleEventsLabel: "Sự kiện đang hiển thị",
    selectedDayTitle: "Ngày đã chọn",
    viewModes: {
      month: "Tháng",
      week: "Tuần",
      day: "Ngày",
    },
    filtersTitle: "Bộ lọc sự kiện",
    filters: {
      pickup: "Pickups",
      return: "Returns",
      booking: "Bookings",
      overdue: "Overdue",
    },
    remindersTitle: "Nhắc việc in-app",
    overdueRemindersTitle: "Đơn quá hạn",
    stuckItemsTitle: "Đồ bị kẹt giặt/bảo trì",
    stuckThresholdPrefix: "Ngưỡng cảnh báo (ngày)",
    noReminders: "Không có nhắc việc.",
    noOverdueReminders: "Không có đơn quá hạn.",
    noStuckItems: "Không có item kẹt giặt/bảo trì.",
    quickViewTitle: "Quick view đơn",
    quickViewEmpty: "Chọn một sự kiện để xem nhanh đơn hàng.",
    openOrderAction: "Mở đơn",
    returnAction: "Trả đồ",
    actionFailed: "Thao tác nhanh thất bại.",
    loading: "Đang tải lịch...",
    errorFallback: "Tải lịch thất bại.",
    retryAction: "Thử lại",
    dayHeaders: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    eventsEmpty: "Không có sự kiện trong ngày này.",
    overDueBadge: "Quá hạn",
  },
  en: {
    title: "Calendar",
    subtitle: "Track pickups, returns, bookings, and overdue highlights for current branch.",
    viewModeLabel: "View mode",
    prevPeriodAction: "Previous period",
    nextPeriodAction: "Next period",
    todayAction: "Today",
    visibleEventsLabel: "Visible events",
    selectedDayTitle: "Selected day",
    viewModes: {
      month: "Month",
      week: "Week",
      day: "Day",
    },
    filtersTitle: "Event filters",
    filters: {
      pickup: "Pickups",
      return: "Returns",
      booking: "Bookings",
      overdue: "Overdue",
    },
    remindersTitle: "In-app reminders",
    overdueRemindersTitle: "Overdue orders",
    stuckItemsTitle: "Items stuck in laundry/maintenance",
    stuckThresholdPrefix: "Alert threshold (days)",
    noReminders: "No reminders.",
    noOverdueReminders: "No overdue orders.",
    noStuckItems: "No stuck laundry/maintenance items.",
    quickViewTitle: "Order quick view",
    quickViewEmpty: "Select an event to preview order details.",
    openOrderAction: "Open order",
    returnAction: "Return",
    actionFailed: "Quick action failed.",
    loading: "Loading calendar...",
    errorFallback: "Failed to load calendar.",
    retryAction: "Retry",
    dayHeaders: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    eventsEmpty: "No events for this day.",
    overDueBadge: "Overdue",
  },
};

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(date: Date): Date {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

function endOfWeekSunday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 6);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function buildMonthGrid(anchor: Date): string[][] {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);

  const firstCell = startOfWeekMonday(monthStart);
  const lastCell = endOfWeekSunday(monthEnd);

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

function buildWeekDays(anchor: Date): string[] {
  const start = startOfWeekMonday(anchor);

  return Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(start, index)));
}

function deriveQueryRange(mode: CalendarViewMode, anchor: Date): { startDate: string; endDate: string } {
  if (mode === "day") {
    const day = toIsoDate(anchor);
    return { startDate: day, endDate: day };
  }

  if (mode === "week") {
    return {
      startDate: toIsoDate(startOfWeekMonday(anchor)),
      endDate: toIsoDate(endOfWeekSunday(anchor)),
    };
  }

  return {
    startDate: toIsoDate(startOfWeekMonday(startOfMonth(anchor))),
    endDate: toIsoDate(endOfWeekSunday(endOfMonth(anchor))),
  };
}

export function useCalendarPage(locale: AppLocale) {
  const copy = CALENDAR_COPY[locale];
  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
    [locale]
  );
  const { currentBranchId } = useAuthAccess();

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [enabledTypes, setEnabledTypes] = useState<Record<CalendarEventType, boolean>>({
    pickup: true,
    return: true,
    booking: true,
    overdue: true,
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const queryRange = useMemo(
    () => deriveQueryRange(viewMode, anchorDate),
    [viewMode, anchorDate]
  );

  const eventsQuery = useCalendarEventsQuery({
    branchId: currentBranchId,
    startDate: queryRange.startDate,
    endDate: queryRange.endDate,
  });

  const quickReturnMutation = useCalendarQuickReturnMutation();

  const payload = calendarStore.eventsPayload;

  const filteredEvents = useMemo(
    () =>
      (payload?.events ?? []).filter((event) => enabledTypes[event.type]),
    [enabledTypes, payload?.events]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDto[]>();

    for (const event of filteredEvents) {
      const bucket = map.get(event.date);
      if (bucket) {
        bucket.push(event);
      } else {
        map.set(event.date, [event]);
      }
    }

    return map;
  }, [filteredEvents]);

  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDate) ?? [],
    [eventsByDate, selectedDate]
  );

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return selectedDateEvents[0] ?? null;
    return filteredEvents.find((event) => event.id === selectedEventId) ?? selectedDateEvents[0] ?? null;
  }, [filteredEvents, selectedDateEvents, selectedEventId]);

  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);
  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate]);

  const today = payload?.today ?? toIsoDate(new Date());

  const toggleEventType = (type: CalendarEventType) => {
    setEnabledTypes((previous) => ({
      ...previous,
      [type]: !previous[type],
    }));
  };

  const goPrev = () => {
    if (viewMode === "month") {
      setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      return;
    }

    if (viewMode === "week") {
      setAnchorDate((prev) => addDays(prev, -7));
      return;
    }

    setAnchorDate((prev) => addDays(prev, -1));
  };

  const goNext = () => {
    if (viewMode === "month") {
      setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      return;
    }

    if (viewMode === "week") {
      setAnchorDate((prev) => addDays(prev, 7));
      return;
    }

    setAnchorDate((prev) => addDays(prev, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setAnchorDate(now);
    setSelectedDate(toIsoDate(now));
    setSelectedEventId(null);
  };

  const setViewModeAndAlign = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === "day") {
      setSelectedDate(toIsoDate(anchorDate));
    }
  };

  const selectDate = (isoDate: string) => {
    setSelectedDate(isoDate);
    setSelectedEventId(null);
  };

  const isMonthCellOutsideCurrentMonth = (isoDate: string): boolean => {
    const date = fromIsoDate(isoDate);
    return date.getMonth() !== anchorDate.getMonth();
  };

  return {
    copy,
    viewModes: CALENDAR_VIEW_MODES,
    eventTypes: CALENDAR_EVENT_TYPES,
    viewMode,
    setViewMode: setViewModeAndAlign,
    anchorDate,
    goPrev,
    goNext,
    jumpToToday,
    monthGrid,
    weekDays,
    selectedDate,
    selectDate,
    today,
    isMonthCellOutsideCurrentMonth,
    isWeekend: (isoDate: string) => isWeekend(fromIsoDate(isoDate)),
    enabledTypes,
    toggleEventType,
    eventsQuery,
    eventsByDate,
    selectedDateEvents,
    selectedEvent,
    setSelectedEventId,
    reminders: payload?.reminders ?? null,
    quickReturnMutation,
    currentBranchId,
    actionCopy: {
      openOrder: copy.openOrderAction,
      returnOrder: copy.returnAction,
    },
    orderStatusLabels,
    itemStatusLabels,
  };
}
