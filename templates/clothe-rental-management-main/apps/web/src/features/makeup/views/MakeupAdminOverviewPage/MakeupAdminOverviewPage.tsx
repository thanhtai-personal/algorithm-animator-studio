"use client";

import { observer } from "mobx-react-lite";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { AppLocale } from "@/constants/locale";
import { useMakeupAdminOverviewPage } from "@/features/makeup/hooks/useMakeupAdminOverviewPage";

interface MakeupAdminOverviewPageProps {
  locale: AppLocale;
}

export const MakeupAdminOverviewPage = observer(function MakeupAdminOverviewPage({
  locale,
}: MakeupAdminOverviewPageProps) {
  const model = useMakeupAdminOverviewPage(locale);
  if (!model.canManage) return null;

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

  if (!model.overview) return null;

  const chartRows = model.overview.chart.map((entry) => ({
    label: entry.label,
    revenue: entry.revenue,
    cost: entry.cost,
    profit: entry.profit,
  }));

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Từ ngày" : "Start date"}</span>
            <input
              type="date"
              value={model.startDate}
              onChange={(event) => model.setStartDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Đến ngày" : "End date"}</span>
            <input
              type="date"
              value={model.endDate}
              onChange={(event) => model.setEndDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Mức gộp" : "Granularity"}</span>
            <select
              value={model.granularity}
              onChange={(event) => model.setGranularity(event.target.value as "day" | "month")}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="day">{model.copy.granularityDay}</option>
              <option value="month">{model.copy.granularityMonth}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5 md:p-5">
        {model.cards.map((card) => (
          <article key={card.key} className="rounded-2xl border border-border bg-muted/10 p-3">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{model.copy.chartTitle}</h2>
        {chartRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{model.copy.chartEmpty}</p>
        ) : (
          <div className="h-80 w-full overflow-x-auto">
            <div className="h-full min-w-[720px]">
              <LineChart width={900} height={320} data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value: number) => model.formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </div>
          </div>
        )}
      </section>
    </section>
  );
});
