"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useMakeupPackagesPage } from "@/features/makeup/hooks/useMakeupPackagesPage";

interface MakeupPackagesPageProps {
  locale: AppLocale;
}

export const MakeupPackagesPage = observer(function MakeupPackagesPage({
  locale,
}: MakeupPackagesPageProps) {
  const model = useMakeupPackagesPage(locale);

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

      {model.canEdit ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Code</span>
              <input
                type="text"
                value={model.code}
                onChange={(event) => model.setCode(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Name</span>
              <input
                type="text"
                value={model.name}
                onChange={(event) => model.setName(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Duration (minutes)</span>
              <input
                type="number"
                min={1}
                value={model.durationMinutes}
                onChange={(event) => model.setDurationMinutes(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Price</span>
              <input
                type="number"
                min={0}
                value={model.priceAmount}
                onChange={(event) => model.setPriceAmount(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Cost</span>
              <input
                type="number"
                min={0}
                value={model.costAmount}
                onChange={(event) => model.setCostAmount(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Description</span>
              <input
                type="text"
                value={model.description}
                onChange={(event) => model.setDescription(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void model.onCreate()}
              disabled={model.createMutation.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
            >
              {model.copy.createAction}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-2 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        {model.packages.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {entry.code} - {entry.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.durationMinutes}m | {entry.priceAmount} / {entry.costAmount}
                </p>
              </div>
              {model.canEdit ? (
                <button
                  type="button"
                  onClick={() => void model.onToggleActive(entry.id, !entry.isActive)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {entry.isActive ? "Deactivate" : "Activate"}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
});
