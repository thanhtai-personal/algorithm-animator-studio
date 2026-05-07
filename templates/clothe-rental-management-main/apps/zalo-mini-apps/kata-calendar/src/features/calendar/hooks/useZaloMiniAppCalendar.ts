import { useMemo, useState } from "react";
import type { ZaloMiniAppMakeupEventDto } from "@/lib/contracts";
import {
  buildMonthGrid,
  dayLabel,
  formatMonthLabel,
  groupEventsByDate,
  parseMonthInput,
  toIsoDate,
  toMonthInputValue,
} from "@/features/calendar/utils/calendarUtils";
import {
  useMiniAppCalendarArtistsQuery,
  useMiniAppCalendarEventsQuery,
} from "@/features/calendar/queries/useZaloMiniAppCalendarQueries";

export function useZaloMiniAppCalendar(
  accessToken: string | null,
  branchId: string | null,
  role: string | null,
  profileId: string | null
) {
  const normalizedRole = role?.trim().toLowerCase() ?? null;
  const isAdminRole = normalizedRole === "owner_admin" || normalizedRole === "manager";
  const isMakeupArtistRole = normalizedRole === "makeup_artist";
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [selectedArtistProfileId, setSelectedArtistProfileId] = useState("");
  const [isDayEventsOpen, setDayEventsOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);
  const monthLabel = useMemo(() => formatMonthLabel(anchorDate), [anchorDate]);
  const monthInputValue = useMemo(() => toMonthInputValue(anchorDate), [anchorDate]);
  const startDate = monthGrid[0]?.[0] ?? toIsoDate(new Date());
  const endDate =
    monthGrid[monthGrid.length - 1]?.[monthGrid[monthGrid.length - 1].length - 1] ??
    toIsoDate(new Date());

  const artistsQuery = useMiniAppCalendarArtistsQuery(
    branchId,
    accessToken,
    Boolean(accessToken && branchId && isAdminRole)
  );
  const artistOptions = useMemo(() => artistsQuery.data?.items ?? [], [artistsQuery.data?.items]);
  const resolvedArtistProfileId = useMemo(() => {
    if (isMakeupArtistRole) return profileId ?? "";
    if (!isAdminRole) return "";
    if (artistOptions.length === 0) return "";

    const hasSelectedArtist = artistOptions.some(
      (artist) => artist.profileId === selectedArtistProfileId
    );
    if (hasSelectedArtist) return selectedArtistProfileId;

    return artistOptions[0]?.profileId ?? "";
  }, [
    artistOptions,
    isAdminRole,
    isMakeupArtistRole,
    profileId,
    selectedArtistProfileId,
  ]);

  const eventsQuery = useMiniAppCalendarEventsQuery(
    {
      branchId,
      startDate,
      endDate,
      artistProfileId: resolvedArtistProfileId || undefined,
    },
    accessToken,
    Boolean(accessToken)
  );

  const eventsByDate = useMemo(() => {
    return groupEventsByDate(eventsQuery.data?.events ?? []);
  }, [eventsQuery.data?.events]);

  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDate) ?? [],
    [eventsByDate, selectedDate]
  );
  const activeEvent = useMemo(
    () =>
      activeEventId
        ? (eventsQuery.data?.events ?? []).find((event) => event.id === activeEventId) ?? null
        : null,
    [activeEventId, eventsQuery.data?.events]
  );

  const openDayEvents = (date: string) => {
    setSelectedDate(date);
    setDayEventsOpen(true);
  };

  const closeDayEvents = () => {
    setDayEventsOpen(false);
    setActiveEventId(null);
  };

  const openEventDetail = (eventId: string) => {
    setDayEventsOpen(true);
    setActiveEventId(eventId);
  };

  const closeEventDetail = () => {
    setActiveEventId(null);
  };

  return {
    eventsQuery,
    monthGrid,
    monthLabel,
    monthInputValue,
    anchorDate,
    selectedDate,
    selectedDateLabel: dayLabel(selectedDate),
    selectedDateEvents,
    isDayEventsOpen,
    activeEvent,
    eventsByDate,
    artistsQuery,
    artistOptions,
    selectedArtistProfileId: resolvedArtistProfileId,
    canSelectArtist: isAdminRole,
    onSelectArtistProfileId: (nextValue: string) => {
      if (!isAdminRole) return;
      setSelectedArtistProfileId(nextValue);
    },
    goPrevMonth: () =>
      setAnchorDate((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1)),
    goNextMonth: () =>
      setAnchorDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1)),
    goToday: () => {
      const now = new Date();
      setAnchorDate(now);
      setSelectedDate(toIsoDate(now));
      setDayEventsOpen(true);
    },
    onSelectMonth: (value: string) => {
      const parsed = parseMonthInput(value);
      if (!parsed) return;
      setAnchorDate(parsed);
    },
    openDayEvents,
    closeDayEvents,
    openEventDetail,
    closeEventDetail,
  };
}

export type ZaloMiniAppCalendarModel = ReturnType<typeof useZaloMiniAppCalendar>;

export function eventCustomerLabel(event: ZaloMiniAppMakeupEventDto): string {
  return event.customerName ?? event.customerPhone ?? event.customerId ?? "-";
}
