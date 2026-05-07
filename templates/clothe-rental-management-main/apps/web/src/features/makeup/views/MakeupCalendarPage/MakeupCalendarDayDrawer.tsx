"use client";

import { createPortal } from "react-dom";
import type { AppLocale } from "@/constants/locale";
import {
  dayLabel,
  eventNoteLabel,
  eventRangeLabel,
} from "./calendarUtils";
import type { MakeupCalendarViewModel } from "./types";

interface MakeupCalendarDayDrawerProps {
  locale: AppLocale;
  model: MakeupCalendarViewModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MakeupCalendarDayDrawer({
  locale,
  model,
  open,
  onOpenChange,
}: MakeupCalendarDayDrawerProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[320] transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label={model.copy.editCloseAction}
        className="absolute inset-0 bg-black/35"
        onClick={() => onOpenChange(false)}
      />

      <section
        className={`absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-xl transition-transform duration-200 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={model.copy.selectedDayTitle}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.selectedDayTitle}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {dayLabel(model.selectedDate, locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {model.copy.editCloseAction}
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {model.selectedDateEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">{model.copy.noEventsInDay}</p>
          ) : (
            model.selectedDateEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  model.onOpenEditEvent(event);
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left ${
                  event.isConflictWarning
                    ? "border-warning/40 bg-warning/10"
                    : "border-border bg-background"
                }`}
              >
                <p className="truncate text-xs text-muted-foreground">{eventNoteLabel(event)}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
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
                  {(event.artistName ?? event.artistProfileId) || "-"} |{" "}
                  {event.customerName ?? event.customerId ?? "-"}
                </p>
              </button>
            ))
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
