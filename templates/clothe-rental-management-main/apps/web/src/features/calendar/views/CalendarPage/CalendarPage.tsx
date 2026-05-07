"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { useCalendarPage } from "@/features/calendar/hooks/useCalendarPage";
import type { CalendarEventType } from "@/types/calendarModule";
import { formatDateLabel } from "@/utils/format/date";

interface CalendarPageProps {
  locale: AppLocale;
}

function formatMonthTitle(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTimeLabel(value: string, locale: AppLocale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function eventTypeClassName(type: CalendarEventType): string {
  if (type === "pickup") return "bg-primary/20 text-primary";
  if (type === "return") return "bg-success/20 text-success";
  if (type === "booking") return "bg-warning/20 text-warning";
  return "bg-destructive/20 text-destructive";
}

function dayNumber(isoDate: string): string {
  return isoDate.slice(8, 10);
}

export const CalendarPage = observer(function CalendarPage({ locale }: CalendarPageProps) {
  const {
    copy,
    viewModes,
    eventTypes,
    viewMode,
    setViewMode,
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
    isWeekend,
    enabledTypes,
    toggleEventType,
    eventsQuery,
    eventsByDate,
    selectedDateEvents,
    selectedEvent,
    setSelectedEventId,
    reminders,
    quickReturnMutation,
    orderStatusLabels,
    itemStatusLabels,
  } = useCalendarPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);

  const selectedDayLabel = useMemo(
    () => formatDateLabel(selectedDate, { locale, dateStyle: "long" }),
    [locale, selectedDate]
  );

  const visibleEventsCount = useMemo(
    () => Array.from(eventsByDate.values()).reduce((count, events) => count + events.length, 0),
    [eventsByDate]
  );

  if (!eventsQuery.data && eventsQuery.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </section>
    );
  }

  if (!eventsQuery.data && eventsQuery.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.errorFallback}</p>
        <button
          type="button"
          onClick={() => void eventsQuery.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {copy.retryAction}
        </button>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            {viewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {copy.viewModes[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label={copy.prevPeriodAction}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              ◀
            </button>
            <p className="min-w-44 text-center text-sm font-semibold text-foreground">
              {viewMode === "day"
                ? formatDateLabel(selectedDate, { locale, dateStyle: "long" })
                : formatMonthTitle(anchorDate, locale)}
            </p>
            <button
              type="button"
              onClick={goNext}
              aria-label={copy.nextPeriodAction}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              ▶
            </button>
          </div>

          <button
            type="button"
            onClick={jumpToToday}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {copy.todayAction}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.visibleEventsLabel}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{visibleEventsCount}</p>
          </article>

          <article className="rounded-2xl border border-border bg-muted/20 p-3 sm:col-span-2 xl:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.selectedDayTitle}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{selectedDayLabel}</p>
          </article>
        </div>
      </header>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.8fr,1fr]">
        <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.filtersTitle}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleEventType(type)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                    enabledTypes[type]
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {copy.filters[type]}
                </button>
              ))}
            </div>
          </div>

          {viewMode === "month" ? (
            <div className="overflow-x-auto">
              <div className="min-w-[680px] space-y-1">
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.dayHeaders.map((label) => (
                    <p key={label} className="rounded-md bg-muted/30 px-1 py-1.5">
                      {label}
                    </p>
                  ))}
                </div>

                {monthGrid.map((week, index) => (
                  <div key={`${week[0]}-${index}`} className="grid grid-cols-7 gap-1">
                    {week.map((date) => {
                      const events = eventsByDate.get(date) ?? [];
                      const isToday = date === today;
                      const isSelected = date === selectedDate;
                      const outside = isMonthCellOutsideCurrentMonth(date);

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => selectDate(date)}
                          className={`min-h-24 rounded-lg border p-2 text-left transition ${
                            isSelected
                              ? "border-primary"
                              : isToday
                                ? "border-success/70"
                                : "border-border"
                          } ${outside ? "bg-muted/20" : "bg-background"}`}
                        >
                          <p
                            className={`text-xs font-semibold ${
                              isWeekend(date) ? "text-warning" : "text-muted-foreground"
                            }`}
                          >
                            {dayNumber(date)}
                          </p>
                          <div className="mt-1 space-y-1">
                            {events.slice(0, 3).map((event) => (
                              <span
                                key={event.id}
                                className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${eventTypeClassName(event.type)}`}
                              >
                                {copy.filters[event.type]}
                              </span>
                            ))}
                            {events.length > 3 ? (
                              <p className="text-[10px] text-muted-foreground">+{events.length - 3}</p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {viewMode === "week" ? (
            <div className="space-y-2">
              {weekDays.map((date) => {
                const events = eventsByDate.get(date) ?? [];

                return (
                  <article
                    key={date}
                    className={`rounded-2xl border p-3 ${date === selectedDate ? "border-primary" : "border-border"}`}
                  >
                    <button type="button" onClick={() => selectDate(date)} className="text-left">
                      <p className="text-sm font-semibold text-foreground">
                        {formatDateLabel(date, { locale, dateStyle: "long" })}
                      </p>
                    </button>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {events.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{copy.eventsEmpty}</p>
                      ) : (
                        events.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => {
                              selectDate(date);
                              setSelectedEventId(event.id);
                            }}
                            className={`rounded px-2 py-1 text-xs font-semibold ${eventTypeClassName(event.type)}`}
                          >
                            {event.order.orderCode}
                          </button>
                        ))
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {viewMode === "day" ? (
            <div className="rounded-2xl border border-border p-3">
              <p className="text-sm font-semibold text-foreground">{selectedDayLabel}</p>
              <div className="mt-2 space-y-2">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{copy.eventsEmpty}</p>
                ) : (
                  selectedDateEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className={`block w-full rounded-lg border border-border px-3 py-2 text-left ${
                        selectedEvent?.id === event.id ? "bg-muted/30" : "bg-background"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">{event.order.orderCode}</p>
                      <p className="text-xs text-muted-foreground">{copy.filters[event.type]}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
            <h2 className="text-sm font-semibold text-foreground">{copy.quickViewTitle}</h2>

            {!selectedEvent ? (
              <p className="mt-2 text-xs text-muted-foreground">{copy.quickViewEmpty}</p>
            ) : (
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                <p className="text-sm font-semibold text-foreground">{selectedEvent.order.orderCode}</p>
                <p>{selectedEvent.order.customerName}</p>
                <p>{selectedEvent.order.customerPhone ?? "-"}</p>
                <p>
                  {formatDateLabel(selectedEvent.order.startDate, { locale })} -{" "}
                  {formatDateLabel(selectedEvent.order.endDate, { locale })}
                </p>
                <StatusBadge
                  kind="order"
                  status={selectedEvent.order.status}
                  labels={orderStatusLabels}
                />
                {selectedEvent.isOverdue ? (
                  <p className="inline-flex rounded bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                    {copy.overDueBadge}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/${locale}/orders/${selectedEvent.order.orderId}`}
                    className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-foreground"
                  >
                    {copy.openOrderAction}
                  </Link>

                  {selectedEvent.order.status === "PICKED_UP" ? (
                    <button
                      type="button"
                      disabled={quickReturnMutation.isPending}
                      onClick={async () => {
                        try {
                          setActionError(null);
                          await quickReturnMutation.mutateAsync(selectedEvent.order.orderId);
                          toast.success(
                            locale === "vi" ? "Đã ghi nhận trả đồ thành công." : "Return completed successfully."
                          );
                        } catch (error) {
                          const message = error instanceof Error ? error.message : copy.actionFailed;
                          setActionError(message);
                          toast.error(message);
                        }
                      }}
                      className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-foreground disabled:opacity-50"
                    >
                      {copy.returnAction}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
            <h2 className="text-sm font-semibold text-foreground">{copy.remindersTitle}</h2>

            {!reminders ? (
              <p className="mt-2 text-xs text-muted-foreground">{copy.noReminders}</p>
            ) : (
              <div className="mt-2 space-y-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">{copy.overdueRemindersTitle}</p>
                  {reminders.overdueOrders.length === 0 ? (
                    <p className="mt-1">{copy.noOverdueReminders}</p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {reminders.overdueOrders.map((entry) => (
                        <Link
                          key={entry.orderId}
                          href={`/${locale}/orders/${entry.orderId}`}
                          className="block rounded-md border border-border/60 px-2 py-1 hover:bg-muted/20"
                        >
                          <p className="font-semibold text-foreground">{entry.orderCode}</p>
                          <p>{entry.customerName}</p>
                          <p>
                            {entry.overdueDays}d - {formatDateLabel(entry.endDate, { locale })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-foreground">{copy.stuckItemsTitle}</p>
                  <p className="mt-1">
                    {copy.stuckThresholdPrefix}: {reminders.laundryStuckThresholdDays}
                  </p>
                  {reminders.stuckItems.length === 0 ? (
                    <p className="mt-1">{copy.noStuckItems}</p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {reminders.stuckItems.map((item) => (
                        <div key={item.itemId} className="rounded-md border border-border/60 px-2 py-1">
                          <p className="font-semibold text-foreground">{item.itemCode}</p>
                          <p>{itemStatusLabels[item.status]}</p>
                          <p>{item.staleDays}d</p>
                          <p>{formatDateTimeLabel(item.updatedAt, locale)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
});
