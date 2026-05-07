"use client";

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
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/data-display/Chart";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { ChartSkeleton, KPISkeleton } from "@/components/feedback/LoadingSkeleton";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { ReportsTabs } from "@/features/reports/components/ReportsTabs";
import { useUtilizationReportPage } from "@/features/reports/hooks/useUtilizationReportPage";
import { paginateItems } from "@/utils/pagination";

interface UtilizationReportPageProps {
  locale: AppLocale;
}

const UTILIZATION_CATEGORY_TABLE_PAGE_SIZE = 12;
const UTILIZATION_PRODUCT_TABLE_PAGE_SIZE = 12;

function formatRate(value: number): string {
  return `${value.toFixed(2)}%`;
}

export const UtilizationReportPage = observer(function UtilizationReportPage({
  locale,
}: UtilizationReportPageProps) {
  const {
    copy,
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
  } = useUtilizationReportPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [categoryTablePage, setCategoryTablePage] = useState(1);
  const [productTablePage, setProductTablePage] = useState(1);

  const categoryColumns = useMemo(
    () => [
      { key: "category", header: copy.tableHeaders.category },
      { key: "totalActive", header: copy.tableHeaders.totalActive, className: "text-right" },
      { key: "onRent", header: copy.tableHeaders.onRent, className: "text-right" },
      { key: "utilization", header: copy.tableHeaders.utilization, className: "text-right" },
    ],
    [copy.tableHeaders]
  );

  const productColumns = useMemo(
    () => [
      { key: "product", header: copy.tableHeaders.product },
      { key: "category", header: copy.tableHeaders.category },
      { key: "totalActive", header: copy.tableHeaders.totalActive, className: "text-right" },
      { key: "onRent", header: copy.tableHeaders.onRent, className: "text-right" },
      { key: "utilization", header: copy.tableHeaders.utilization, className: "text-right" },
    ],
    [copy.tableHeaders]
  );
  const categoryRowsPagination = useMemo(
    () =>
      paginateItems(
        report?.byCategory ?? [],
        categoryTablePage,
        UTILIZATION_CATEGORY_TABLE_PAGE_SIZE
      ),
    [categoryTablePage, report?.byCategory]
  );
  const productRowsPagination = useMemo(
    () =>
      paginateItems(
        report?.byProduct ?? [],
        productTablePage,
        UTILIZATION_PRODUCT_TABLE_PAGE_SIZE
      ),
    [productTablePage, report?.byProduct]
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

  const utilizationPieRows = [
    { key: "onRent", label: copy.kpi.onRentItems, value: report.kpi.onRentItems, color: "hsl(var(--primary))" },
    {
      key: "available",
      label: locale === "vi" ? "Sẵn sàng/khác" : "Available/other",
      value: Math.max(report.kpi.totalActiveItems - report.kpi.onRentItems, 0),
      color: "hsl(var(--muted-foreground))",
    },
  ];

  const categoryChartRows = report.byCategory
    .slice(0, 8)
    .map((row) => ({ label: row.categoryName, utilization: Number(row.utilizationRate.toFixed(2)) }));

  const utilizationPieConfig: ChartConfig = {
    onRent: {
      label: copy.kpi.onRentItems,
      color: "hsl(var(--primary))",
    },
    available: {
      label: locale === "vi" ? "Sẵn sàng/khác" : "Available/other",
      color: "hsl(var(--muted-foreground))",
    },
  };

  const categoryChartConfig: ChartConfig = {
    utilization: {
      label: copy.tableHeaders.utilization,
      color: "hsl(var(--primary))",
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
                  locale === "vi" ? "Đã xuất báo cáo hiệu suất." : "Utilization report exported."
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
          <ReportsTabs locale={locale} activeTab="utilization" />
          <p className="text-xs text-muted-foreground">
            {copy.kpi.asOfDate}: <span className="font-semibold text-foreground">{report.asOfDate}</span>
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
        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
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

      <section className="animate-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.kpi.totalActiveItems}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">{report.kpi.totalActiveItems}</p>
        </article>

        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.kpi.onRentItems}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">{report.kpi.onRentItems}</p>
        </article>

        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.kpi.utilizationRate}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">{formatRate(report.kpi.utilizationRate)}</p>
        </article>

        <article className="motion-safe-hover-lift rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.kpi.asOfDate}
          </p>
          <p className="mt-2 text-lg font-bold text-foreground">{report.asOfDate}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.kpi.utilizationRate}</h2>

          <ChartContainer config={utilizationPieConfig} className="mt-3 h-72 w-full">
            <PieChart>
              <Pie
                data={utilizationPieRows}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={108}
                paddingAngle={4}
                dataKey="value"
                nameKey="label"
              >
                {utilizationPieRows.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.key === "onRent" ? "var(--color-onRent)" : "var(--color-available)"}
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

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.categoryTitle}</h2>

          {categoryChartRows.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{copy.categoryEmpty}</p>
          ) : (
            <ChartContainer config={categoryChartConfig} className="mt-3 h-72 w-full">
              <BarChart data={categoryChartRows}>
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
                  tickFormatter={(value: number) => `${Math.round(value)}%`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex min-w-[10rem] flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">{copy.tableHeaders.utilization}</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatRate(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </article>
      </section>

      <DataTableShell
        locale={locale}
        title={copy.categoryTitle}
        className="rounded-2xl shadow-sm"
        columns={categoryColumns}
        isLoading={reportQuery.isLoading || reportQuery.isFetching}
        isEmpty={report.byCategory.length === 0}
        emptyState={copy.categoryEmpty}
        loadingState={copy.loading}
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() =>
                setCategoryTablePage(Math.max(1, categoryRowsPagination.page - 1))
              }
              disabled={categoryRowsPagination.page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Trước" : "Prev"}
            </button>
            <span>
              {locale === "vi" ? "Trang" : "Page"} {categoryRowsPagination.page}/
              {categoryRowsPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCategoryTablePage(
                  Math.min(categoryRowsPagination.totalPages, categoryRowsPagination.page + 1)
                )
              }
              disabled={categoryRowsPagination.page >= categoryRowsPagination.totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Sau" : "Next"}
            </button>
          </div>
        }
      >
        {categoryRowsPagination.items.map((row) => (
          <tr key={row.productCategoryId ?? "uncategorized"} className="border-b border-border/70 last:border-0">
            <td className="px-4 py-3 text-xs text-muted-foreground">{row.categoryName}</td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">{row.totalActiveItems}</td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">{row.onRentItems}</td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-foreground">
              {formatRate(row.utilizationRate)}
            </td>
          </tr>
        ))}
      </DataTableShell>

      <DataTableShell
        locale={locale}
        title={copy.productTitle}
        className="rounded-2xl shadow-sm"
        columns={productColumns}
        isLoading={reportQuery.isLoading || reportQuery.isFetching}
        isEmpty={report.byProduct.length === 0}
        emptyState={copy.productEmpty}
        loadingState={copy.loading}
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() =>
                setProductTablePage(Math.max(1, productRowsPagination.page - 1))
              }
              disabled={productRowsPagination.page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Trước" : "Prev"}
            </button>
            <span>
              {locale === "vi" ? "Trang" : "Page"} {productRowsPagination.page}/
              {productRowsPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setProductTablePage(
                  Math.min(productRowsPagination.totalPages, productRowsPagination.page + 1)
                )
              }
              disabled={productRowsPagination.page >= productRowsPagination.totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Sau" : "Next"}
            </button>
          </div>
        }
      >
        {productRowsPagination.items.map((row) => (
          <tr key={row.productId} className="border-b border-border/70 last:border-0">
            <td className="px-4 py-3 text-xs text-muted-foreground">{row.productName}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{row.categoryName ?? "-"}</td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">{row.totalActiveItems}</td>
            <td className="px-4 py-3 text-right text-xs text-muted-foreground">{row.onRentItems}</td>
            <td className="px-4 py-3 text-right text-xs font-semibold text-foreground">
              {formatRate(row.utilizationRate)}
            </td>
          </tr>
        ))}
      </DataTableShell>
    </section>
  );
});
