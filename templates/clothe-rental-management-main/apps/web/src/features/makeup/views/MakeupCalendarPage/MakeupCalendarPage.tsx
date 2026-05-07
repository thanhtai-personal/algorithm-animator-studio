"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { MakeupEventEditDrawer } from "@/features/makeup/components/MakeupEventEditDrawer";
import { useMakeupCalendarPage } from "@/features/makeup/hooks/useMakeupCalendarPage";
import { MakeupCalendarDayDrawer } from "./MakeupCalendarDayDrawer";
import {
  dayLabel,
  dayNumber,
  eventChipClassName,
  eventNoteLabel,
  eventRangeLabel,
  isOutsideCurrentMonth,
  MAX_EVENT_IN_CELL,
} from "./calendarUtils";
import type { MakeupCalendarPageProps } from "./types";

export const MakeupCalendarPage = observer(function MakeupCalendarPage({
  locale,
}: MakeupCalendarPageProps) {
  const model = useMakeupCalendarPage(locale);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);

  const openDayDrawer = (date: string) => {
    model.onSelectDate(date);
    setDayDrawerOpen(true);
  };

  if (!model.eventsQuery.data && model.eventsQuery.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
      </section>
    );
  }

  if (!model.eventsQuery.data && model.eventsQuery.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
        <p className="text-sm text-destructive">{model.copy.loadError}</p>
        <button
          type="button"
          onClick={() => void model.eventsQuery.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {model.copy.retryAction}
        </button>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{model.copy.createTitle}</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.eventDate}</span>
            <input
              type="date"
              value={model.eventDate}
              min={model.todayIso}
              onChange={(event) => model.setEventDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.startTime}</span>
            <input
              type="time"
              value={model.startTime}
              onChange={(event) => model.setStartTime(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.endTime}</span>
            <input
              type="time"
              value={model.endTime}
              onChange={(event) => model.setEndTime(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.artist}</span>
            <select
              value={model.artistProfileId}
              onChange={(event) => model.setArtistProfileId(event.target.value)}
              disabled={model.role === "makeup_artist" || (model.artistsQuery.data?.items ?? []).length === 0}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              {(model.artistsQuery.data?.items ?? []).length === 0 ? (
                <option value="">-</option>
              ) : null}
              {(model.artistsQuery.data?.items ?? []).map((artist) => (
                <option key={artist.profileId} value={artist.profileId}>
                  {artist.fullName ?? artist.profileId}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.customerId}</span>
            <input
              type="search"
              value={model.customerSearch}
              onChange={(event) => model.onCustomerSearchChange(event.target.value)}
              placeholder={model.copy.customerSearchPlaceholder}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          {model.customerId ? (
            <p className="text-xs text-primary">{model.copy.customerId}: {model.customerId}</p>
          ) : null}

          {model.customerOptions.length > 0 ? (
            <div className="max-h-36 overflow-y-auto rounded-xl border border-border bg-background">
              {model.customerOptions.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => model.onSelectCustomer(customer)}
                  className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/20"
                >
                  <span className="font-semibold text-foreground">{customer.fullName}</span>
                  <span className="text-xs text-muted-foreground">{customer.phone ?? "-"}</span>
                </button>
              ))}
            </div>
          ) : null}

          {model.customerSearch.trim().length >= 2 &&
          !model.customerTypeaheadQuery.isFetching &&
          model.customerOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{model.copy.customerNoResult}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={model.onToggleQuickCustomer}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {model.copy.customerQuickCreateAction}
            </button>
          </div>

          {model.quickCustomerOpen ? (
            <div className="grid gap-2 rounded-xl border border-border bg-background p-3 md:grid-cols-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:col-span-3">
                {model.copy.customerQuickCreateTitle}
              </p>
              <label className="space-y-1 text-xs text-muted-foreground md:col-span-1">
                <span>{model.copy.customerQuickCreateName}</span>
                <input
                  type="text"
                  value={model.quickCustomerName}
                  onChange={(event) => model.setQuickCustomerName(event.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground md:col-span-1">
                <span>{model.copy.customerQuickCreatePhone}</span>
                <input
                  type="tel"
                  value={model.quickCustomerPhone}
                  onChange={(event) => model.setQuickCustomerPhone(event.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
                />
              </label>
              <div className="flex items-end gap-2 md:col-span-1">
                <button
                  type="button"
                  onClick={() => void model.onCreateQuickCustomer()}
                  disabled={model.createCustomerMutation.isPending}
                  className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {model.copy.customerQuickCreateSubmit}
                </button>
                <button
                  type="button"
                  onClick={model.onToggleQuickCustomer}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-foreground"
                >
                  {model.copy.customerQuickCreateCancel}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.package}</span>
            <select
              value={model.packageId}
              onChange={(event) => model.setPackageId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{model.copy.noPackage}</option>
              {(model.packagesQuery.data?.items ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.code} - {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.surchargeAmount}</span>
            <input
              type="number"
              min={0}
              step="1000"
              value={model.surchargeAmount}
              onChange={(event) => model.setSurchargeAmount(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{model.copy.note}</span>
            <input
              type="text"
              value={model.note}
              onChange={(event) => model.setNote(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void model.onCreateEvent()}
            disabled={model.createMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {model.copy.saveAction}
          </button>
        </div>

        {model.pendingConflict ? (
          <div className="space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
            <p className="font-semibold">{model.copy.conflictsTitle}</p>
            <p className="text-muted-foreground">{model.copy.conflictHint}</p>
            <ul className="space-y-1">
              {model.pendingConflict.conflicts.map((entry) => (
                <li key={`${entry.eventId}-${entry.reason}`} className="font-mono text-[11px]">
                  {entry.eventDate} {entry.sessionSlot} [{entry.reason}]
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void model.onConfirmConflictOverride()}
                className="rounded-lg border border-warning/40 bg-background px-3 py-1.5 font-semibold"
              >
                {model.copy.confirmConflictAction}
              </button>
              <button
                type="button"
                onClick={model.onCancelConflict}
                className="rounded-lg border border-border bg-background px-3 py-1.5"
              >
                {model.copy.cancelConflictAction}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">{model.copy.monthCalendarTitle}</h2>
            <p className="text-sm font-semibold text-muted-foreground">{model.monthLabel}</p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {(model.canSelectCalendarArtist || model.isCalendarArtistLocked) ? (
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>{model.copy.artist}</span>
                <select
                  value={model.calendarArtistProfileId}
                  onChange={(event) => model.setCalendarArtistProfileId(event.target.value)}
                  disabled={model.isCalendarArtistLocked || (model.artistsQuery.data?.items ?? []).length === 0}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                >
                  {(model.artistsQuery.data?.items ?? []).length === 0 ? (
                    <option value="">-</option>
                  ) : null}
                  {(model.artistsQuery.data?.items ?? []).map((artist) => (
                    <option key={artist.profileId} value={artist.profileId}>
                      {artist.fullName ?? artist.profileId}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="grid gap-1 text-xs text-muted-foreground">
              <span>{model.copy.monthPickerLabel}</span>
              <input
                type="month"
                value={model.monthInputValue}
                onChange={(event) => model.onSelectMonth(event.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
              />
            </label>

            <button
              type="button"
              onClick={model.goPrevMonth}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {model.copy.prevMonthAction}
            </button>
            <button
              type="button"
              onClick={model.goToday}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {model.copy.todayAction}
            </button>
            <button
              type="button"
              onClick={model.goNextMonth}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {model.copy.nextMonthAction}
            </button>
          </div>
        </header>

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
                      onClick={() => openDayDrawer(date)}
                      className={`min-h-24 rounded-lg border p-2 ${
                        isSelected ? "border-primary" : "border-border"
                      } ${outside ? "bg-muted/20" : "bg-background"} cursor-pointer`}
                    >
                      <p className="text-left text-xs font-semibold text-muted-foreground">
                        {dayNumber(date)}
                      </p>

                      <div className="mt-1 space-y-1">
                        {events.slice(0, MAX_EVENT_IN_CELL).map((event, eventIndex) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              model.onOpenEditEvent(event);
                            }}
                            className={`block w-full rounded border px-1.5 py-1 text-left text-[10px] ${eventChipClassName(
                              event,
                              eventIndex
                            )}`}
                          >
                            <p className="truncate leading-4">{eventNoteLabel(event)}</p>
                            <p className="mt-0.5 font-semibold leading-4">
                              {eventRangeLabel(event, locale)}
                            </p>
                          </button>
                        ))}

                        {events.length > MAX_EVENT_IN_CELL ? (
                          <button
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              openDayDrawer(date);
                            }}
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
          <p className="text-sm font-semibold text-foreground">
            {dayLabel(model.selectedDate, locale)}
          </p>

          {model.selectedDateEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">{model.copy.noEventsInDay}</p>
          ) : (
            <div className="space-y-2">
              {model.selectedDateEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => model.onOpenEditEvent(event)}
                  className={`rounded-xl border px-3 py-2 ${
                    event.isConflictWarning
                      ? "border-warning/40 bg-warning/10"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      {eventRangeLabel(event, locale)}
                    </p>
                    {model.dayConflictMap.get(event.eventDate) ? (
                      <span className="rounded-full border border-warning/40 bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                        {model.copy.dayConflictBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(event.artistName ?? event.artistProfileId) || "-"} | {event.customerName ?? event.customerId ?? "-"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      <MakeupCalendarDayDrawer
        locale={locale}
        model={model}
        open={dayDrawerOpen}
        onOpenChange={setDayDrawerOpen}
      />

      <MakeupEventEditDrawer model={model} />
    </section>
  );
});
