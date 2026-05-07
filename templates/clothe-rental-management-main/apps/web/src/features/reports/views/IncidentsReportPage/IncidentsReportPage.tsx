"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { AppLocale } from "@/constants/locale";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/data-display/Chart";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { ChartSkeleton, KPISkeleton } from "@/components/feedback/LoadingSkeleton";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { DateRangeField } from "@/components/forms/DateRangeField";
import { ReportsTabs } from "@/features/reports/components/ReportsTabs";
import { useIncidentsReportPage } from "@/features/reports/hooks/useIncidentsReportPage";
import type { OrderIncidentType } from "@/types/ordersDomain";
import { paginateItems } from "@/utils/pagination";
import {
  formatIncidentCurrency,
  formatIncidentDateTime,
  getIncidentStatusClassName,
  INCIDENT_STATUS_ORDER,
  INCIDENT_TYPE_ORDER,
  INCIDENTS_TABLE_PAGE_SIZE,
} from "./incidentsReportPage.utils";

interface IncidentsReportPageProps {
  locale: AppLocale;
}

export const IncidentsReportPage = observer(function IncidentsReportPage({
  locale,
}: IncidentsReportPageProps) {
  const {
    copy,
    dateRange,
    setDateRange,
    typeFilter,
    setTypeFilter,
    typeOptions,
    typeLabels,
    statusLabels,
    branchFilterValue,
    setBranchFilter,
    branchOptions,
    resetFilters,
    canExport,
    canSelectBranch,
    reportQuery,
    report,
    exportCsv,
    exportCsvMutation,
  } = useIncidentsReportPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);

  const columns = useMemo(
    () => [
      { key: "createdAt", header: copy.tableHeaders.createdAt },
      { key: "orderCode", header: copy.tableHeaders.orderCode },
      { key: "itemCode", header: copy.tableHeaders.itemCode },
      { key: "customer", header: copy.tableHeaders.customer },
      { key: "type", header: copy.tableHeaders.type },
      { key: "status", header: copy.tableHeaders.status },
      { key: "amount", header: copy.tableHeaders.amount, className: "text-right" },
      { key: "applyToDeposit", header: copy.tableHeaders.applyToDeposit },
      { key: "description", header: copy.tableHeaders.description },
    ],
    [copy.tableHeaders]
  );
  const incidentsRowsPagination = useMemo(
    () => paginateItems(report?.items ?? [], tablePage, INCIDENTS_TABLE_PAGE_SIZE),
    [report?.items, tablePage]
  );

  if (!report && reportQuery.isLoading) {
    return (
      <section className="space-y-4 animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        </div>
        <KPISkeleton />
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </section>
    );
  }

  if (!report && reportQuery.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.errorFallback}</p>
        <button
          type="button"
          onClick={() => void reportQuery.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {copy.retryAction}
        </button>
      </section>
    );
  }

  if (!report) {
    return null;
  }

  const typeChartRows = INCIDENT_TYPE_ORDER.map((type) => ({
    label: typeLabels[type],
    amount: report.summary.byTypeAmount[type],
  }));

  const statusPieRows = INCIDENT_STATUS_ORDER.map((status, index) => ({
    key: status,
    label: statusLabels[status],
    value: report.summary.byStatusCount[status],
    color:
      index === 0
        ? "hsl(var(--warning))"
        : index === 1
          ? "hsl(var(--success))"
          : "hsl(var(--muted-foreground))",
  }));

  const typeChartConfig: ChartConfig = {
    amount: {
      label: copy.tableHeaders.amount,
      color: "hsl(var(--warning))",
    },
  };

  const statusChartConfig: ChartConfig = {
    OPEN: {
      label: statusLabels.OPEN,
      color: "hsl(var(--warning))",
    },
    SETTLED: {
      label: statusLabels.SETTLED,
      color: "hsl(var(--success))",
    },
    WAIVED: {
      label: statusLabels.WAIVED,
      color: "hsl(var(--muted-foreground))",
    },
  };

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!canExport) return;
              try {
                setActionError(null);
                await exportCsv();
                toast.success(
                  locale === "vi" ? "Đã xuất báo cáo sự cố." : "Incidents report exported."
                );
              } catch (error) {
                const message = error instanceof Error ? error.message : copy.errorFallback;
                setActionError(message);
                toast.error(message);
              }
            }}
            disabled={!canExport || exportCsvMutation.isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
          >
            {copy.exportAction}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReportsTabs locale={locale} activeTab="incidents" />
        </div>

        {!canExport ? <p className="text-xs text-muted-foreground">{copy.exportRestricted}</p> : null}
      </header>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      <FilterBarShell
        locale={locale}
        onReset={resetFilters}
        resetLabel={copy.resetFilters}
        className="rounded-2xl shadow-sm"
      >
        <DateRangeField
          locale={locale}
          value={dateRange}
          variant="compact"
          startLabel={copy.dateRangeFilterLabel}
          endLabel={locale === "vi" ? "Đến" : "To"}
          onChange={setDateRange}
        />

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground">
          <span>{copy.typeFilterLabel}</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as OrderIncidentType | "")}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.allTypes}</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground">
          <span>{copy.branchFilterLabel}</span>
          <select
            value={branchFilterValue}
            disabled={!canSelectBranch}
            onChange={(event) => setBranchFilter(event.target.value)}
            className="bg-transparent text-xs outline-none disabled:opacity-60"
          >
            {branchOptions.length > 0 ? (
              branchOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))
            ) : (
              <option value="">{copy.allBranches}</option>
            )}
          </select>
        </label>
      </FilterBarShell>

      <section className="animate-stagger grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.summary.totalIncidents}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">{report.summary.totalIncidents}</p>
        </article>

        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.summary.totalAmount}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">
            {formatIncidentCurrency(report.summary.totalAmount, report.currencyCode, locale)}
          </p>
        </article>

        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.summary.byTypeAmount}
          </p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>
              {typeLabels.LATE}: {formatIncidentCurrency(report.summary.byTypeAmount.LATE, report.currencyCode, locale)}
            </p>
            <p>
              {typeLabels.DAMAGE}: {formatIncidentCurrency(report.summary.byTypeAmount.DAMAGE, report.currencyCode, locale)}
            </p>
            <p>
              {typeLabels.LOST}: {formatIncidentCurrency(report.summary.byTypeAmount.LOST, report.currencyCode, locale)}
            </p>
            <p>
              {typeLabels.CLEANING}: {formatIncidentCurrency(report.summary.byTypeAmount.CLEANING, report.currencyCode, locale)}
            </p>
          </div>
        </article>

        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.summary.byStatusCount}
          </p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>
              {statusLabels.OPEN}: {report.summary.byStatusCount.OPEN}
            </p>
            <p>
              {statusLabels.SETTLED}: {report.summary.byStatusCount.SETTLED}
            </p>
            <p>
              {statusLabels.WAIVED}: {report.summary.byStatusCount.WAIVED}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.summary.byTypeAmount}</h2>

          <ChartContainer config={typeChartConfig} className="mt-3 h-72 w-full">
            <BarChart data={typeChartRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex min-w-[11rem] flex-1 items-center justify-between gap-3">
                        <span className="text-muted-foreground">{copy.tableHeaders.amount}</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatIncidentCurrency(Number(value), report.currencyCode, locale)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.summary.byStatusCount}</h2>

          <ChartContainer config={statusChartConfig} className="mt-3 h-72 w-full">
            <PieChart>
              <Pie
                data={statusPieRows}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={108}
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
              >
                {statusPieRows.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={
                      entry.key === "OPEN"
                        ? "var(--color-OPEN)"
                        : entry.key === "SETTLED"
                          ? "var(--color-SETTLED)"
                          : "var(--color-WAIVED)"
                    }
                  />
                ))}
              </Pie>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex min-w-[10rem] flex-1 items-center justify-between gap-3">
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span className="font-mono font-medium text-foreground">{Number(value)}</span>
                      </div>
                    )}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </article>
      </section>

      <DataTableShell
        locale={locale}
        title={copy.tableTitle}
        className="rounded-2xl shadow-sm"
        columns={columns}
        isLoading={reportQuery.isLoading || reportQuery.isFetching}
        isEmpty={report.items.length === 0}
        emptyState={copy.tableEmpty}
        loadingState={copy.loading}
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setTablePage(Math.max(1, incidentsRowsPagination.page - 1))}
              disabled={incidentsRowsPagination.page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Trước" : "Prev"}
            </button>
            <span>
              {locale === "vi" ? "Trang" : "Page"} {incidentsRowsPagination.page}/
              {incidentsRowsPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setTablePage(
                  Math.min(incidentsRowsPagination.totalPages, incidentsRowsPagination.page + 1)
                )
              }
              disabled={incidentsRowsPagination.page >= incidentsRowsPagination.totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Sau" : "Next"}
            </button>
          </div>
        }
      >
        {incidentsRowsPagination.items.map((row) => (
          <tr key={row.incidentId} className="border-b border-border/70 last:border-0">
            <td className="px-4 py-3 text-xs text-muted-foreground">{formatIncidentDateTime(row.createdAt, locale)}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              <Link
                href={`/${locale}/orders/${row.orderId}`}
                className="font-mono text-xs font-semibold text-foreground underline-offset-2 hover:underline"
              >
                {row.orderCode}
              </Link>
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{row.itemCode ?? "-"}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{row.customerName ?? copy.unknownCustomer}</p>
              <p>{row.customerPhone ?? "-"}</p>
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{typeLabels[row.type]}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getIncidentStatusClassName(
                  row.status
                )}`}
              >
                {statusLabels[row.status]}
              </span>
            </td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-foreground">
              {formatIncidentCurrency(row.amount, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              {row.applyToDeposit ? copy.applyDepositYes : copy.applyDepositNo}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{row.description ?? "-"}</td>
          </tr>
        ))}
      </DataTableShell>
    </section>
  );
});
