"use client";

import type { AppLocale } from "@/constants/locale";
import type { MakeupEventDto } from "@/types/makeupModule";
import type { MakeupProductBookingModel } from "@/features/makeup/hooks/useMakeupProductBooking";

interface MakeupMonthlyCalendarProps {
  model: MakeupProductBookingModel;
  locale: AppLocale;
}

const MAX_EVENT_IN_CELL = 3;
const EVENT_CHIP_COLOR_CLASSNAMES = [
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-200",
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200",
  "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/15 dark:text-violet-200",
] as const;

function dayNumber(date: string): string {
  return date.slice(8, 10);
}

function isOutsideCurrentMonth(date: string, anchorDate: Date): boolean {
  const [yearText, monthText] = date.split("-");
  const year = Number.parseInt(yearText ?? "0", 10);
  const month = Number.parseInt(monthText ?? "0", 10);

  return year !== anchorDate.getFullYear() || month !== anchorDate.getMonth() + 1;
}

function eventRangeLabel(event: MakeupEventDto, locale: AppLocale): string {
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

function dayLabel(date: string, locale: AppLocale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "full",
  }).format(parsed);
}

function eventChipClassName(event: MakeupEventDto, index: number): string {
  if (event.isConflictWarning) {
    return "border border-warning/40 bg-warning/15 text-warning";
  }

  return EVENT_CHIP_COLOR_CLASSNAMES[index % EVENT_CHIP_COLOR_CLASSNAMES.length];
}

export function MakeupMonthlyCalendar({
  model,
  locale,
}: MakeupMonthlyCalendarProps) {
  const selectedDayLabel = dayLabel(model.selectedDate, locale);

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">{model.copy.calendarTitle}</h3>
          <p className="text-sm font-semibold text-muted-foreground">{model.monthLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={model.goPrevMonth}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {model.copy.prevMonthAction}
          </button>

          <button
            type="button"
            onClick={model.goToday}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {model.copy.todayAction}
          </button>

          <button
            type="button"
            onClick={model.goNextMonth}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {model.copy.nextMonthAction}
          </button>
        </div>
      </header>

      {!model.hasCloudSession ? (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
          {model.copy.noSessionHint}
        </p>
      ) : null}

      {model.eventsQuery.isError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {(model.eventsQuery.error as Error | null)?.message ?? model.copy.noEventsInDay}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <div className="min-w-[680px] space-y-1">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.dayHeaders.map((label) => (
              <p key={label} className="rounded-md bg-muted/30 px-1 py-1.5">
                {label}
              </p>
            ))}
          </div>

          {model.monthGrid.map((week, index) => (
            <div key={`${week[0]}-${index}`} className="grid grid-cols-7 gap-1">
              {week.map((date) => {
                const events = model.eventsByDate.get(date) ?? [];
                const outside = isOutsideCurrentMonth(date, model.anchorDate);
                const isSelected = date === model.selectedDate;

                return (
                  <article
                    key={date}
                    className={`min-h-28 rounded-lg border p-2 ${
                      isSelected ? "border-primary" : "border-border"
                    } ${outside ? "bg-muted/20" : "bg-background"}`}
                  >
                    <button
                      type="button"
                      onClick={() => model.setSelectedDate(date)}
                      className="text-left text-xs font-semibold text-muted-foreground"
                    >
                      {dayNumber(date)}
                    </button>

                    <div className="mt-1 space-y-1">
                      {events.slice(0, MAX_EVENT_IN_CELL).map((event, eventIndex) => (
                        <span
                          key={event.id}
                          className={`block truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold ${eventChipClassName(
                            event,
                            eventIndex
                          )}`}
                        >
                          {eventRangeLabel(event, locale)}
                        </span>
                      ))}

                      {events.length > MAX_EVENT_IN_CELL ? (
                        <button
                          type="button"
                          onClick={() => model.setSelectedDate(date)}
                          className="text-[10px] text-primary"
                        >
                          +{events.length - MAX_EVENT_IN_CELL} {model.copy.moreEventsLabel}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.selectedDayTitle}
        </p>
        <p className="text-sm font-semibold text-foreground">{selectedDayLabel}</p>

        {model.eventsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">{model.copy.calendarLoading}</p>
        ) : model.selectedDateEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">{model.copy.noEventsInDay}</p>
        ) : (
          <div className="space-y-2">
            {model.selectedDateEvents.map((event) => (
              <article
                key={event.id}
                className={`rounded-xl border px-3 py-2 ${
                  event.isConflictWarning
                    ? "border-warning/40 bg-warning/10"
                    : "border-border bg-background"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">
                  {eventRangeLabel(event, locale)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.customerName ?? event.customerPhone ?? event.customerId ?? "-"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
