"use client";

import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { useRevenueReportPage } from "@/features/reports/hooks/useRevenueReportPage";
import type { RevenueReportGranularity } from "@/types/reportsModule";
import { resolveFinancialFormulaVersionLabel } from "@/utils/financeFormula";
import { paginateItems } from "@/utils/pagination";

interface RevenueReportPageProps {
  locale: AppLocale;
}

const REVENUE_DAILY_TABLE_PAGE_SIZE = 20;
const REVENUE_TOP_PRODUCTS_PAGE_SIZE = 10;
const REVENUE_TOP_ITEMS_PAGE_SIZE = 10;

function formatCurrency(value: number, currencyCode: string, locale: AppLocale): string {
  const formatLocale = currencyCode.toUpperCase() === "VND"
    ? "vi-VN"
    : locale === "vi"
      ? "vi-VN"
      : "en-US";
  try {
    return new Intl.NumberFormat(formatLocale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat(formatLocale, {
      maximumFractionDigits: 0,
    }).format(value);
  }
}

function resolveSignedProfitClassName(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return "text-foreground";
}

function toChartDateLabel(
  value: string,
  granularity: RevenueReportGranularity,
  locale: AppLocale
): string {
  if (granularity === "year") {
    return value;
  }

  if (granularity === "month") {
    const parsed = new Date(`${value}-01T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  }).format(parsed);
}

export const RevenueReportPage = observer(function RevenueReportPage({
  locale,
}: RevenueReportPageProps) {
  const {
    copy,
    dateRange,
    setDateRange,
    branchFilterValue,
    setBranchFilter,
    granularity,
    setGranularity,
    branchOptions,
    resetFilters,
    canExport,
    canSelectBranch,
    reportQuery,
    report,
    exportCsv,
    exportCsvMutation,
  } = useRevenueReportPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [dailyTablePage, setDailyTablePage] = useState(1);
  const [topProductsTablePage, setTopProductsTablePage] = useState(1);
  const [topItemsTablePage, setTopItemsTablePage] = useState(1);

  const dailyColumns = useMemo(
    () => [
      { key: "date", header: copy.tableHeaders.date },
      { key: "revenueGross", header: copy.tableHeaders.revenueGross, className: "text-right" },
      { key: "refundEffective", header: copy.tableHeaders.refundEffective, className: "text-right" },
      { key: "revenueNet", header: copy.tableHeaders.revenueNet, className: "text-right" },
      { key: "cogs", header: copy.tableHeaders.cogs, className: "text-right" },
      { key: "grossProfit", header: copy.tableHeaders.grossProfit, className: "text-right" },
      { key: "realProfit", header: copy.tableHeaders.realProfit, className: "text-right" },
      { key: "cashInflow", header: copy.tableHeaders.cashInflow, className: "text-right" },
      { key: "cashOutflow", header: copy.tableHeaders.cashOutflow, className: "text-right" },
      { key: "depositCollected", header: copy.kpi.depositCollectedTotal, className: "text-right" },
      { key: "depositRefunded", header: copy.kpi.depositRefundedTotal, className: "text-right" },
    ],
    [copy.kpi, copy.tableHeaders]
  );
  const dailyRowsPagination = useMemo(
    () => paginateItems(report?.dailyRows ?? [], dailyTablePage, REVENUE_DAILY_TABLE_PAGE_SIZE),
    [dailyTablePage, report?.dailyRows]
  );
  const topProductsPagination = useMemo(
    () =>
      paginateItems(
        report?.topProducts ?? [],
        topProductsTablePage,
        REVENUE_TOP_PRODUCTS_PAGE_SIZE
      ),
    [report?.topProducts, topProductsTablePage]
  );
  const topItemsPagination = useMemo(
    () =>
      paginateItems(report?.topItems ?? [], topItemsTablePage, REVENUE_TOP_ITEMS_PAGE_SIZE),
    [report?.topItems, topItemsTablePage]
  );
  const pageLabel = locale === "vi" ? "Trang" : "Page";
  const prevLabel = locale === "vi" ? "Trước" : "Prev";
  const nextLabel = locale === "vi" ? "Sau" : "Next";

  if (!report && reportQuery.isLoading) {
    return (
      <section className="space-y-4 animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        </div>
        <KPISkeleton />
        <ChartSkeleton />
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

  const chartRows = report.dailyRows.map((row) => ({
    label: toChartDateLabel(row.date, report.granularity, locale),
    revenueNet: row.revenueNet,
    cogs: row.cogs,
    grossProfit: row.grossProfit,
    realProfit: row.realProfit,
    deposit: row.depositCollectedTotal,
  }));

  const chartScrollableWidth =
    chartRows.length === 0
      ? 0
      : Math.max(780, chartRows.length * (report.granularity === "day" ? 116 : 92));

  const topProductPeak = Math.max(1, ...report.topProducts.map((item) => item.bookingCount));
  const chartConfig: ChartConfig = {
    revenueNet: {
      label: copy.tableHeaders.revenueNet,
      color: "hsl(211 90% 56%)",
    },
    cogs: {
      label: copy.tableHeaders.cogs,
      color: "hsl(var(--warning))",
    },
    grossProfit: {
      label: copy.tableHeaders.grossProfit,
      color: "hsl(var(--success))",
    },
    realProfit: {
      label: copy.tableHeaders.realProfit,
      color: "hsl(var(--destructive))",
    },
    deposit: {
      label: copy.kpi.depositCollectedTotal,
      color: "hsl(var(--chart-2))",
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
                  locale === "vi" ? "Đã xuất báo cáo doanh thu." : "Revenue report exported."
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
          <ReportsTabs locale={locale} activeTab="revenue" />
          <p className="text-xs text-muted-foreground">
            {copy.topMetricLabel}: <span className="font-semibold text-foreground">{report.topRentalsMetric}</span>
          </p>
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

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground">
          <span>{copy.granularityFilterLabel}</span>
          <select
            value={granularity}
            onChange={(event) => setGranularity(event.target.value as RevenueReportGranularity)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="day">{copy.granularity.day}</option>
            <option value="month">{copy.granularity.month}</option>
            <option value="year">{copy.granularity.year}</option>
          </select>
        </label>
      </FilterBarShell>

      <section className="animate-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-9">
        {[
          {
            key: "revenueGross",
            label: copy.kpi.revenueGross,
            value: formatCurrency(report.kpi.revenueGross, report.currencyCode, locale),
          },
          {
            key: "refundEffective",
            label: copy.kpi.refundEffective,
            value: formatCurrency(report.kpi.refundEffective, report.currencyCode, locale),
            valueClassName: "text-destructive",
          },
          {
            key: "revenueNet",
            label: copy.kpi.revenueNet,
            value: formatCurrency(report.kpi.revenueNet, report.currencyCode, locale),
          },
          {
            key: "cogs",
            label: copy.kpi.cogs,
            value: formatCurrency(report.kpi.cogs, report.currencyCode, locale),
          },
          {
            key: "grossProfit",
            label: copy.kpi.grossProfit,
            value: formatCurrency(report.kpi.grossProfit, report.currencyCode, locale),
            valueClassName: resolveSignedProfitClassName(report.kpi.grossProfit),
          },
          {
            key: "profitMargin",
            label: copy.kpi.profitMargin,
            value: `${(report.kpi.profitMargin * 100).toFixed(2)}%`,
            valueClassName: resolveSignedProfitClassName(report.kpi.profitMargin),
          },
          {
            key: "salesProfit",
            label: copy.kpi.salesProfit,
            value: formatCurrency(report.kpi.salesProfit, report.currencyCode, locale),
            valueClassName: resolveSignedProfitClassName(report.kpi.salesProfit),
          },
          {
            key: "realProfit",
            label: copy.kpi.realProfit,
            value: formatCurrency(report.kpi.realProfit, report.currencyCode, locale),
            valueClassName: resolveSignedProfitClassName(report.kpi.realProfit),
          },
          {
            key: "cashInflow",
            label: copy.kpi.cashInflow,
            value: formatCurrency(report.kpi.cashInflow, report.currencyCode, locale),
            valueClassName: "text-success",
          },
          {
            key: "cashOutflow",
            label: copy.kpi.cashOutflow,
            value: formatCurrency(report.kpi.cashOutflow, report.currencyCode, locale),
            valueClassName: "text-destructive",
          },
          {
            key: "depositCollectedTotal",
            label: copy.kpi.depositCollectedTotal,
            value: formatCurrency(report.kpi.depositCollectedTotal, report.currencyCode, locale),
            valueClassName: "text-success",
          },
          {
            key: "depositRefundedTotal",
            label: copy.kpi.depositRefundedTotal,
            value: formatCurrency(report.kpi.depositRefundedTotal, report.currencyCode, locale),
            valueClassName: "text-destructive",
          },
          {
            key: "outstandingDebt",
            label: copy.kpi.outstandingDebt,
            value: formatCurrency(report.kpi.outstandingDebt, report.currencyCode, locale),
          },
        ].map((entry) => (
          <article
            key={entry.key}
            className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {entry.label}
            </p>
            <p className={`mt-2 text-lg font-bold ${entry.valueClassName ?? "text-foreground"}`}>
              {entry.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">{copy.dailyTableTitle}</h2>

          {chartRows.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{copy.dailyTableEmpty}</p>
          ) : (
            <div className="mt-3 overflow-x-auto pb-1">
              <div
                style={{
                  minWidth: "100%",
                  width: chartScrollableWidth > 0 ? `${chartScrollableWidth}px` : "100%",
                }}
              >
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <BarChart data={chartRows} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickFormatter={(value: number) => `${Math.round(value / 1_000_000)}M`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className="flex min-w-[11rem] flex-1 items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {name === "revenueNet"
                                  ? copy.tableHeaders.revenueNet
                                  : name === "cogs"
                                    ? copy.tableHeaders.cogs
                                    : name === "grossProfit"
                                      ? copy.tableHeaders.grossProfit
                                      : name === "realProfit"
                                        ? copy.tableHeaders.realProfit
                                      : copy.kpi.depositCollectedTotal}
                              </span>
                              <span
                                className={`font-mono font-medium ${
                                  name === "grossProfit" || name === "realProfit"
                                    ? resolveSignedProfitClassName(Number(value))
                                    : "text-foreground"
                                }`}
                              >
                                {formatCurrency(Number(value), report.currencyCode, locale)}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="revenueNet" fill="var(--color-revenueNet)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="cogs" fill="var(--color-cogs)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="grossProfit" fill="var(--color-grossProfit)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="realProfit" fill="var(--color-realProfit)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="deposit" fill="var(--color-deposit)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.topProductsTitle}</h2>

          {report.topProducts.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{copy.topEmpty}</p>
          ) : (
            <div className="mt-3 space-y-3">
              {report.topProducts.slice(0, 5).map((row, index) => (
                <div key={row.productId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-foreground">
                      #{index + 1} {row.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.bookingCount}</p>
                  </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.max(8, (row.bookingCount / topProductPeak) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {locale === "vi" ? "Công thức" : "Formula"}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {resolveFinancialFormulaVersionLabel(report.formulaVersion, locale)}: {report.formulaNote}
        </p>
      </section>

      <DataTableShell
        locale={locale}
        title={copy.dailyTableTitle}
        className="rounded-2xl shadow-sm"
        columns={dailyColumns}
        isLoading={reportQuery.isLoading || reportQuery.isFetching}
        isEmpty={report.dailyRows.length === 0}
        emptyState={copy.dailyTableEmpty}
        loadingState={copy.loading}
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setDailyTablePage(Math.max(1, dailyRowsPagination.page - 1))}
              disabled={dailyRowsPagination.page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {prevLabel}
            </button>
            <span>
              {pageLabel} {dailyRowsPagination.page}/{dailyRowsPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setDailyTablePage(
                  Math.min(dailyRowsPagination.totalPages, dailyRowsPagination.page + 1)
                )
              }
              disabled={dailyRowsPagination.page >= dailyRowsPagination.totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {nextLabel}
            </button>
          </div>
        }
      >
        {dailyRowsPagination.items.map((row) => (
          <tr key={row.date} className="border-b border-border/70 last:border-0">
            <td className="px-4 py-3 text-xs text-muted-foreground">{row.date}</td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
              {formatCurrency(row.revenueGross, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
              {formatCurrency(row.refundEffective, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
              {formatCurrency(row.revenueNet, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
              {formatCurrency(row.cogs, report.currencyCode, locale)}
            </td>
            <td
              className={`px-4 py-3 text-right text-xs font-semibold ${resolveSignedProfitClassName(
                row.grossProfit
              )}`}
            >
              {formatCurrency(row.grossProfit, report.currencyCode, locale)}
            </td>
            <td
              className={`px-4 py-3 text-right text-xs font-semibold ${resolveSignedProfitClassName(
                row.realProfit
              )}`}
            >
              {formatCurrency(row.realProfit, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-success">
              {formatCurrency(row.cashInflow, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-destructive">
              {formatCurrency(row.cashOutflow, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-success">
              {formatCurrency(row.depositCollectedTotal, report.currencyCode, locale)}
            </td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-destructive">
              {formatCurrency(row.depositRefundedTotal, report.currencyCode, locale)}
            </td>
          </tr>
        ))}
      </DataTableShell>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.topProductsTitle}</h2>

          {report.topProducts.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{copy.topEmpty}</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">{copy.tableHeaders.product}</th>
                      <th className="px-3 py-2">{copy.tableHeaders.category}</th>
                      <th className="px-3 py-2 text-right">{copy.tableHeaders.bookingCount}</th>
                      <th className="px-3 py-2 text-right">{copy.tableHeaders.rentalDays}</th>
                      <th className="px-3 py-2 text-right">{copy.tableHeaders.rentAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductsPagination.items.map((row) => (
                      <tr key={row.productId} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.productName}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.categoryName ?? "-"}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{row.bookingCount}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{row.rentalDays}</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                          {formatCurrency(row.rentAmount, report.currencyCode, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() =>
                    setTopProductsTablePage(Math.max(1, topProductsPagination.page - 1))
                  }
                  disabled={topProductsPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {prevLabel}
                </button>
                <span>
                  {pageLabel} {topProductsPagination.page}/{topProductsPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTopProductsTablePage(
                      Math.min(topProductsPagination.totalPages, topProductsPagination.page + 1)
                    )
                  }
                  disabled={topProductsPagination.page >= topProductsPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {nextLabel}
                </button>
              </div>
            </>
          )}
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.topItemsTitle}</h2>

          {report.topItems.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">{copy.topEmpty}</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">{copy.tableHeaders.itemCode}</th>
                      <th className="px-3 py-2">{copy.tableHeaders.product}</th>
                      <th className="px-3 py-2">{copy.tableHeaders.variant}</th>
                      <th className="px-3 py-2 text-right">{copy.tableHeaders.bookingCount}</th>
                      <th className="px-3 py-2 text-right">{copy.tableHeaders.rentalDays}</th>
                      <th className="px-3 py-2 text-right">{copy.tableHeaders.rentAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItemsPagination.items.map((row) => (
                      <tr key={row.itemId} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.itemCode}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.productName}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.variantName ?? "-"}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{row.bookingCount}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{row.rentalDays}</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                          {formatCurrency(row.rentAmount, report.currencyCode, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() =>
                    setTopItemsTablePage(Math.max(1, topItemsPagination.page - 1))
                  }
                  disabled={topItemsPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {prevLabel}
                </button>
                <span>
                  {pageLabel} {topItemsPagination.page}/{topItemsPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTopItemsTablePage(
                      Math.min(topItemsPagination.totalPages, topItemsPagination.page + 1)
                    )
                  }
                  disabled={topItemsPagination.page >= topItemsPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {nextLabel}
                </button>
              </div>
            </>
          )}
        </article>
      </section>
    </section>
  );
});
