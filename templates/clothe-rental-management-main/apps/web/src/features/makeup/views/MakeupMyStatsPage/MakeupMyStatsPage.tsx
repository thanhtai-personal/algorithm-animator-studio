"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useMakeupMyStatsPage } from "@/features/makeup/hooks/useMakeupMyStatsPage";

interface MakeupMyStatsPageProps {
  locale: AppLocale;
}

export const MakeupMyStatsPage = observer(function MakeupMyStatsPage({
  locale,
}: MakeupMyStatsPageProps) {
  const model = useMakeupMyStatsPage(locale);

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

  if (!model.stats) {
    return null;
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <section className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4 md:p-5">
        <article className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="mt-1 text-lg font-bold text-foreground">{model.stats.revenue}</p>
        </article>
        <article className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Cost</p>
          <p className="mt-1 text-lg font-bold text-foreground">{model.stats.cost}</p>
        </article>
        <article className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Profit</p>
          <p className="mt-1 text-lg font-bold text-foreground">{model.stats.profit}</p>
        </article>
        <article className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-xs text-muted-foreground">Events</p>
          <p className="mt-1 text-lg font-bold text-foreground">{model.stats.eventCount}</p>
        </article>
      </section>
    </section>
  );
});
