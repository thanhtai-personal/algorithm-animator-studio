"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarClientService } from "@/features/calendar/services/calendarClientService";
import { calendarStore } from "@/features/calendar/stores/calendarStore";
import type { CalendarEventsQuery } from "@/types/calendarModule";

const calendarQueryKeys = {
  all: ["calendar"] as const,
  events: () => [...calendarQueryKeys.all, "events"] as const,
  eventList: (query: CalendarEventsQuery) =>
    [...calendarQueryKeys.events(), query.branchId ?? "", query.startDate, query.endDate] as const,
};

export function useCalendarEventsQuery(query: CalendarEventsQuery) {
  const queryResult = useQuery({
    queryKey: calendarQueryKeys.eventList(query),
    queryFn: () => calendarClientService.fetchEvents(query),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    calendarStore.hydrateEvents(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCalendarQuickReturnMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => calendarClientService.quickReturnOrder(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: calendarQueryKeys.events() }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export { calendarQueryKeys };
