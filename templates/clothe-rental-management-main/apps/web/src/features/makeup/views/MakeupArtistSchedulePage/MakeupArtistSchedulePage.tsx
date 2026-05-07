"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useMakeupArtistSchedulePage } from "@/features/makeup/hooks/useMakeupArtistSchedulePage";

interface MakeupArtistSchedulePageProps {
  locale: AppLocale;
  artistProfileId: string;
}

export const MakeupArtistSchedulePage = observer(function MakeupArtistSchedulePage({
  locale,
  artistProfileId,
}: MakeupArtistSchedulePageProps) {
  const model = useMakeupArtistSchedulePage(locale, artistProfileId);

  if (!model.canAccess) {
    return null;
  }

  if (!model.query.data && model.query.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
      </section>
    );
  }

  if (!model.query.data && model.query.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 shadow-md">
        <p className="text-sm text-destructive">{model.copy.loadError}</p>
        <button
          type="button"
          onClick={() => void model.query.refetch()}
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

      <section className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:grid-cols-2 md:p-5">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Start</span>
          <input
            type="date"
            value={model.startDate}
            onChange={(event) => model.setStartDate(event.target.value)}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>End</span>
          <input
            type="date"
            value={model.endDate}
            onChange={(event) => model.setEndDate(event.target.value)}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
      </section>

      <section className="space-y-2 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        {model.events.map((event) => (
          <article key={event.id} className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-sm font-semibold text-foreground">
              {event.eventDate} - {event.sessionSlot}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {event.customerName ?? event.customerId ?? "-"}
            </p>
          </article>
        ))}
      </section>
    </section>
  );
});
