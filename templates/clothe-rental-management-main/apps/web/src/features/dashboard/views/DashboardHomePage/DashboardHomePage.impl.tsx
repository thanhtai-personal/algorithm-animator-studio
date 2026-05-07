"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Clock3,
  PackageCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/data-display/Chart";
import { ChartSkeleton } from "@/components/feedback/LoadingSkeleton";
import type { AppLocale } from "@/constants/locale";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { DateRangeField } from "@/components/forms/DateRangeField";
import { useDashboardOverviewPage } from "@/features/dashboard/hooks/useDashboardOverviewPage";
import type { RevenueReportGranularity } from "@/types/reportsModule";
import { formatDateLabel } from "@/utils/format/date";
import { paginateItems } from "@/utils/pagination";

interface DashboardHomePageProps {
  locale: AppLocale;
}

const DASHBOARD_ORDER_TABLE_PAGE_SIZE = 10;

function formatDateTimeLabel(value: string, locale: AppLocale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

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

function resolveActivityStyle(action: string): {
  icon: LucideIcon;
  iconClassName: string;
  containerClassName: string;
} {
  const normalized = action.trim().toUpperCase();

  if (normalized.includes("CANCEL") || normalized.includes("VOID")) {
    return {
      icon: AlertCircle,
      iconClassName: "text-destructive",
      containerClassName: "border-destructive/20 bg-destructive/5",
    };
  }

  if (normalized.includes("REFUND") || normalized.includes("OVERDUE")) {
    return {
      icon: Clock3,
      iconClassName: "text-warning",
      containerClassName: "border-warning/20 bg-warning/5",
    };
  }

  return {
    icon: ClipboardList,
    iconClassName: "text-primary",
    containerClassName: "border-border bg-card",
  };
}

export const DashboardHomePage = observer(function DashboardHomePage({
  locale,
}: DashboardHomePageProps) {
  const {
    copy,
    overview,
    financialReport,
    overviewQuery,
    financialReportQuery,
    quickReturnMutation,
    orderStatusLabels,
    financialSummaryPreset,
    setFinancialSummaryPreset,
    financialDateRange,
    setFinancialDateRange,
    financialGranularity,
    setFinancialGranularity,
    activityLabelResolver,
  } = useDashboardOverviewPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [runningOrderId, setRunningOrderId] = useState<string | null>(null);
  const [dueTodayPage, setDueTodayPage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);

  const kpi = overview?.kpi ?? null;
  const financialKpi = financialReport?.kpi ?? null;
  const dueTodayPagination = useMemo(
    () =>
      paginateItems(
        overview?.dueTodayOrders ?? [],
        dueTodayPage,
        DASHBOARD_ORDER_TABLE_PAGE_SIZE
      ),
    [dueTodayPage, overview?.dueTodayOrders]
  );
  const overduePagination = useMemo(
    () =>
      paginateItems(
        overview?.overdueOrders ?? [],
        overduePage,
        DASHBOARD_ORDER_TABLE_PAGE_SIZE
      ),
    [overduePage, overview?.overdueOrders]
  );
  const paginationLabel = locale === "vi" ? "Trang" : "Page";
  const prevLabel = locale === "vi" ? "Trước" : "Prev";
  const nextLabel = locale === "vi" ? "Sau" : "Next";

  const financialCards = useMemo(() => {
    if (!financialKpi || !financialReport) return [];
    const currencyCode = financialReport.currencyCode;

    return [
      {
        key: "revenueToday",
        label: copy.kpi.revenueToday,
        formula: copy.kpiFormula.revenueToday,
        value: formatCurrency(financialKpi.revenueNet, currencyCode, locale),
        icon: TrendingUp,
        accentClassName: "text-success",
      },
      {
        key: "grossProfitToday",
        label: copy.kpi.grossProfitToday,
        formula: copy.kpiFormula.grossProfitToday,
        value: formatCurrency(financialKpi.grossProfit, currencyCode, locale),
        icon: TrendingUp,
        accentClassName: resolveSignedProfitClassName(financialKpi.grossProfit),
        valueClassName: resolveSignedProfitClassName(financialKpi.grossProfit),
      },
      {
        key: "salesProfitToday",
        label: copy.kpi.salesProfitToday,
        formula: copy.kpiFormula.salesProfitToday,
        value: formatCurrency(financialKpi.salesProfit, currencyCode, locale),
        icon: TrendingUp,
        accentClassName: resolveSignedProfitClassName(financialKpi.salesProfit),
        valueClassName: resolveSignedProfitClassName(financialKpi.salesProfit),
      },
      {
        key: "realProfitToday",
        label: copy.kpi.realProfitToday,
        formula: copy.kpiFormula.realProfitToday,
        value: formatCurrency(financialKpi.realProfit, currencyCode, locale),
        icon: TrendingUp,
        accentClassName: resolveSignedProfitClassName(financialKpi.realProfit),
        valueClassName: resolveSignedProfitClassName(financialKpi.realProfit),
      },
      {
        key: "realInflowToday",
        label: copy.kpi.realInflowToday,
        formula: copy.kpiFormula.realInflowToday,
        value: formatCurrency(financialKpi.cashInflow, currencyCode, locale),
        icon: ClipboardList,
        accentClassName: "text-success",
        valueClassName: "text-success",
      },
      {
        key: "realOutflowToday",
        label: copy.kpi.realOutflowToday,
        formula: copy.kpiFormula.realOutflowToday,
        value: formatCurrency(financialKpi.cashOutflow, currencyCode, locale),
        icon: AlertCircle,
        accentClassName: "text-destructive",
        valueClassName: "text-destructive",
      },
      {
        key: "depositCollectedToday",
        label: copy.kpi.depositCollectedToday,
        formula: copy.kpiFormula.depositCollectedToday,
        value: formatCurrency(financialKpi.depositCollectedTotal, currencyCode, locale),
        icon: ClipboardList,
        accentClassName: "text-success",
        valueClassName: "text-success",
      },
      {
        key: "depositRefundedToday",
        label: copy.kpi.depositRefundedToday,
        formula: copy.kpiFormula.depositRefundedToday,
        value: formatCurrency(financialKpi.depositRefundedTotal, currencyCode, locale),
        icon: AlertCircle,
        accentClassName: "text-destructive",
        valueClassName: "text-destructive",
      },
      {
        key: "outstandingDebtTotal",
        label: copy.kpi.outstandingDebtTotal,
        formula: copy.kpiFormula.outstandingDebtTotal,
        value: formatCurrency(financialKpi.outstandingDebt, currencyCode, locale),
        icon: CalendarClock,
        accentClassName: "text-warning",
      },
    ];
  }, [copy.kpi, copy.kpiFormula, financialKpi, financialReport, locale]);

  const kpiCards = useMemo(() => {
    if (!kpi) return [];

    return [
      {
        key: "initialCapitalNetTotal",
        label: copy.kpi.initialCapitalNetTotal,
        value: formatCurrency(kpi.initialCapitalNetTotal, kpi.currencyCode, locale),
        icon: TrendingUp,
        accentClassName: resolveSignedProfitClassName(kpi.initialCapitalNetTotal),
        valueClassName: resolveSignedProfitClassName(kpi.initialCapitalNetTotal),
      },
      {
        key: "importOrderExpenseTotal",
        label: copy.kpi.importOrderExpenseTotal,
        value: formatCurrency(kpi.importOrderExpenseTotal, kpi.currencyCode, locale),
        icon: AlertCircle,
        accentClassName: "text-destructive",
        valueClassName: "text-destructive",
      },
      {
        key: "ordersReserved",
        label: copy.kpi.ordersReserved,
        value: String(kpi.ordersReserved),
        icon: CalendarClock,
        accentClassName: "text-primary",
      },
      {
        key: "reservedPickupToday",
        label: copy.kpi.reservedPickupToday,
        value: String(kpi.reservedPickupToday),
        icon: Clock3,
        accentClassName: "text-warning",
      },
      {
        key: "reservedPickupOverdue",
        label: copy.kpi.reservedPickupOverdue,
        value: String(kpi.reservedPickupOverdue),
        icon: AlertCircle,
        accentClassName: "text-destructive",
      },
      {
        key: "ordersOnRent",
        label: copy.kpi.ordersOnRent,
        value: String(kpi.ordersOnRent),
        icon: PackageCheck,
        accentClassName: "text-primary",
      },
      {
        key: "dueToday",
        label: copy.kpi.dueToday,
        value: String(kpi.dueToday),
        icon: CalendarClock,
        accentClassName: "text-warning",
      },
      {
        key: "overdue",
        label: copy.kpi.overdue,
        value: String(kpi.overdue),
        icon: AlertCircle,
        accentClassName: "text-destructive",
      },
      {
        key: "itemsInLaundry",
        label: copy.kpi.itemsInLaundry,
        value: String(kpi.itemsInLaundry),
        icon: ClipboardList,
        accentClassName: "text-primary",
      },
    ];
  }, [copy.kpi, kpi, locale]);

  const moduleMetricCards = useMemo(() => {
    if (!kpi?.moduleMetrics || kpi.moduleMetrics.length === 0) return [];

    return kpi.moduleMetrics.map((metric) => ({
      key: metric.module,
      label:
        metric.module === "ALL_MODULES"
          ? copy.moduleMetrics.all
          : metric.module === "RENTAL_SALE_MODULE"
            ? copy.moduleMetrics.rentalSale
            : copy.moduleMetrics.makeup,
      revenue: metric.revenue,
      profit: metric.profit,
      orderCount: metric.orderCount,
    }));
  }, [copy.moduleMetrics, kpi?.moduleMetrics]);

  const financialChartRows = useMemo(() => {
    if (!financialReport) return [];

    return financialReport.dailyRows.map((row) => ({
      label: toChartDateLabel(row.date, financialReport.granularity, locale),
      revenueNet: row.revenueNet,
      grossProfit: row.grossProfit,
    }));
  }, [financialReport, locale]);

  const financialChartScrollableWidth = useMemo(() => {
    if (!financialReport || financialChartRows.length === 0) return 0;
    const pointWidth = financialReport.granularity === "day" ? 92 : 76;
    return Math.max(720, financialChartRows.length * pointWidth);
  }, [financialChartRows.length, financialReport]);

  const financialChartConfig: ChartConfig = {
    revenueNet: {
      label: copy.kpi.revenueToday,
      color: "hsl(211 90% 56%)",
    },
    grossProfit: {
      label: copy.kpi.grossProfitToday,
      color: "hsl(var(--success))",
    },
  };

  const operationalChartRows = useMemo(() => {
    if (!kpi) return [];

    return [
      {
        key: "reserved",
        label: copy.kpi.ordersReserved,
        value: kpi.ordersReserved,
      },
      {
        key: "onRent",
        label: copy.kpi.ordersOnRent,
        value: kpi.ordersOnRent,
      },
      {
        key: "dueToday",
        label: copy.kpi.dueToday,
        value: kpi.dueToday,
      },
      {
        key: "overdue",
        label: copy.kpi.overdue,
        value: kpi.overdue,
      },
      {
        key: "laundry",
        label: copy.kpi.itemsInLaundry,
        value: kpi.itemsInLaundry,
      },
    ];
  }, [copy.kpi, kpi]);

  const activityTrendRows = useMemo(() => {
    if (!overview?.recentActivities.length) return [];

    const dailyCounts = new Map<string, number>();
    for (const activity of overview.recentActivities) {
      const date = activity.createdAt.slice(0, 10);
      dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
    }

    return Array.from(dailyCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({
        dateLabel: formatDateLabel(date, { locale }),
        events: count,
      }));
  }, [locale, overview?.recentActivities]);

  const operationalChartConfig: ChartConfig = {
    value: {
      label: locale === "vi" ? "Số lượng" : "Count",
      color: "hsl(var(--primary))",
    },
  };

  const activityChartConfig: ChartConfig = {
    events: {
      label: locale === "vi" ? "Sự kiện" : "Events",
      color: "hsl(var(--warning))",
    },
  };

  const handleQuickReturn = async (orderId: string) => {
    try {
      setActionError(null);
      setRunningOrderId(orderId);
      await quickReturnMutation.mutateAsync(orderId);
      toast.success(locale === "vi" ? "Đã ghi nhận trả đồ thành công." : "Return completed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.actionFailed;
      setActionError(message);
      toast.error(message);
    } finally {
      setRunningOrderId(null);
    }
  };

  if (!overview && overviewQuery.isLoading) {
    return (
      <section className="space-y-4 animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        </div>
        <ChartSkeleton />
      </section>
    );
  }

  if (!overview && overviewQuery.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.errorFallback}</p>
        <button
          type="button"
          onClick={() => void overviewQuery.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {copy.retryAction}
        </button>
      </section>
    );
  }

  if (!overview || !kpi) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {copy.todayContext}: <span className="font-semibold text-foreground">{kpi.today}</span> ({kpi.timezone})
              </p>
              <p className="text-xs text-muted-foreground">
                {copy.kpi.profitMarginToday}:{" "}
                <span
                  className={`font-semibold ${resolveSignedProfitClassName(
                    financialKpi?.profitMargin ?? kpi.profitMarginToday
                  )}`}
                >
                  {((financialKpi?.profitMargin ?? kpi.profitMarginToday) * 100).toFixed(2)}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-end">
          <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
            {copy.soldItemsBadge}: {kpi.soldItemsTotal}
          </span>
        </div>
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {financialCards.map((card) => (
            <article
              key={card.key}
              className="motion-safe-hover-lift min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/90">
                    {card.formula}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <card.icon className={`h-4 w-4 ${card.accentClassName}`} />
                </span>
              </div>
              <p className={`max-w-full break-words text-xl font-bold leading-tight [overflow-wrap:anywhere] sm:text-2xl ${card.valueClassName ?? "text-foreground"}`}>
                {card.value}
              </p>
            </article>
          ))}
        </div>
        <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map((card) => (
            <article
              key={card.key}
              className="motion-safe-hover-lift min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 text-xs text-muted-foreground">{card.label}</p>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <card.icon className={`h-4 w-4 ${card.accentClassName}`} />
                </span>
              </div>
              <p className={`max-w-full break-words text-xl font-bold leading-tight [overflow-wrap:anywhere] sm:text-2xl ${card.valueClassName ?? "text-foreground"}`}>
                {card.value}
              </p>
            </article>
          ))}
        </div>
      </section>

      {moduleMetricCards.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{copy.moduleMetrics.title}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {moduleMetricCards.map((card) => (
              <article key={card.key} className="rounded-xl border border-border bg-muted/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <div className="mt-2 space-y-1 text-sm text-foreground">
                  <p>
                    {copy.moduleMetrics.revenue}:{" "}
                    <span className="font-semibold">
                      {formatCurrency(card.revenue, kpi.currencyCode, locale)}
                    </span>
                  </p>
                  <p>
                    {copy.moduleMetrics.profit}:{" "}
                    <span className={`font-semibold ${resolveSignedProfitClassName(card.profit)}`}>
                      {formatCurrency(card.profit, kpi.currencyCode, locale)}
                    </span>
                  </p>
                  <p>
                    {copy.moduleMetrics.orderCount}:{" "}
                    <span className="font-semibold">{card.orderCount}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-sm font-semibold text-foreground">{copy.financialChartTitle}</h2>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground">
              <span>{copy.financialSummaryPresetLabel}</span>
              <select
                value={financialSummaryPreset}
                onChange={(event) =>
                  setFinancialSummaryPreset(
                    event.target.value as "day" | "week" | "month" | "custom"
                  )
                }
                className="bg-transparent text-xs outline-none"
              >
                <option value="day">{copy.financialSummaryPreset.day}</option>
                <option value="week">{copy.financialSummaryPreset.week}</option>
                <option value="month">{copy.financialSummaryPreset.month}</option>
                {financialSummaryPreset === "custom" ? (
                  <option value="custom">{copy.financialSummaryPreset.custom}</option>
                ) : null}
              </select>
            </label>
            <DateRangeField
              locale={locale}
              value={financialDateRange}
              variant="compact"
              startLabel={copy.financialDateRangeLabel}
              endLabel={locale === "vi" ? "Đến" : "To"}
              onChange={setFinancialDateRange}
            />
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground">
              <span>{copy.financialGranularityLabel}</span>
              <select
                value={financialGranularity}
                onChange={(event) =>
                  setFinancialGranularity(event.target.value as RevenueReportGranularity)
                }
                className="bg-transparent text-xs outline-none"
              >
                <option value="day">{copy.granularity.day}</option>
                <option value="month">{copy.granularity.month}</option>
                <option value="year">{copy.granularity.year}</option>
              </select>
            </label>
          </div>
        </div>

        {financialReportQuery.isLoading && !financialReport ? (
          <div className="mt-3">
            <ChartSkeleton />
          </div>
        ) : null}

        {financialReportQuery.isError && !financialReport ? (
          <div className="mt-3 space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-xs text-destructive">{copy.financialChartError}</p>
            <button
              type="button"
              onClick={() => void financialReportQuery.refetch()}
              className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {copy.retryAction}
            </button>
          </div>
        ) : null}

        {financialReport && financialChartRows.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{copy.financialChartEmpty}</p>
        ) : null}

        {financialReport && financialChartRows.length > 0 ? (
          <div className="mt-3 overflow-x-auto pb-1">
            <div
              style={{
                minWidth: "100%",
                width:
                  financialChartScrollableWidth > 0
                    ? `${financialChartScrollableWidth}px`
                    : "100%",
              }}
            >
              <ChartContainer config={financialChartConfig} className="h-72 w-full">
                <BarChart data={financialChartRows} barGap={8}>
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
                                ? copy.kpi.revenueToday
                                : copy.kpi.grossProfitToday}
                            </span>
                            <span
                              className={`font-mono font-medium ${
                                name === "grossProfit"
                                  ? resolveSignedProfitClassName(Number(value))
                                  : "text-foreground"
                              }`}
                            >
                              {formatCurrency(
                                Number(value),
                                financialReport.currencyCode,
                                locale
                              )}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="revenueNet" fill="var(--color-revenueNet)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="grossProfit" fill="var(--color-grossProfit)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              {locale === "vi" ? "Tổng quan vận hành" : "Operational Snapshot"}
            </h2>
          </div>

          <ChartContainer config={operationalChartConfig} className="h-64 w-full">
            <BarChart data={operationalChartRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex min-w-[11rem] flex-1 items-center justify-between gap-3">
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span className="font-mono font-medium text-foreground">{Number(value)}</span>
                      </div>
                    )}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">
            {locale === "vi" ? "Hoạt động 7 ngày gần nhất" : "Recent Activity Trend"}
          </h2>

          {activityTrendRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{copy.activitiesEmpty}</p>
          ) : (
            <ChartContainer config={activityChartConfig} className="mt-3 h-64 w-full">
              <LineChart data={activityTrendRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex min-w-[10rem] flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {locale === "vi" ? "Sự kiện" : "Events"}
                          </span>
                          <span className="font-mono font-medium text-foreground">{Number(value)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Legend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="var(--color-events)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-events)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
            <h2 className="text-lg font-semibold text-foreground">{copy.dueTodayTitle}</h2>

            {overview.dueTodayOrders.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{copy.dueTodayEmpty}</p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2">{copy.tableHeaders.orderCode}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.customer}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.period}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.status}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dueTodayPagination.items.map((order) => (
                        <tr key={order.orderId} className="border-b border-border/70 last:border-0">
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs text-muted-foreground">{order.orderCode}</span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">{order.customerName}</p>
                            <p>{order.customerPhone ?? "-"}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {formatDateLabel(order.startDate, { locale })} - {" "}
                            {formatDateLabel(order.endDate, { locale })}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <StatusBadge kind="order" status={order.status} labels={orderStatusLabels} />
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/${locale}/orders/${order.orderId}`}
                                className="rounded-lg border border-border px-2.5 py-1 font-semibold"
                              >
                                {copy.openAction}
                              </Link>

                              {order.status === "PICKED_UP" ? (
                                <button
                                  type="button"
                                  disabled={Boolean(runningOrderId) || quickReturnMutation.isPending}
                                  onClick={() => void handleQuickReturn(order.orderId)}
                                  className="rounded-lg border border-border px-2.5 py-1 font-semibold disabled:opacity-50"
                                >
                                  {copy.returnAction}
                                </button>
                              ) : null}
                            </div>
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
                      setDueTodayPage(Math.max(1, dueTodayPagination.page - 1))
                    }
                    disabled={dueTodayPagination.page <= 1}
                    className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                  >
                    {prevLabel}
                  </button>
                  <span>
                    {paginationLabel} {dueTodayPagination.page}/{dueTodayPagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDueTodayPage(
                        Math.min(
                          dueTodayPagination.totalPages,
                          dueTodayPagination.page + 1
                        )
                      )
                    }
                    disabled={dueTodayPagination.page >= dueTodayPagination.totalPages}
                    className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                  >
                    {nextLabel}
                  </button>
                </div>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
            <h2 className="text-lg font-semibold text-foreground">{copy.overdueTitle}</h2>

            {overview.overdueOrders.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{copy.overdueEmpty}</p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2">{copy.tableHeaders.orderCode}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.customer}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.period}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.updatedAt}</th>
                        <th className="px-3 py-2">{copy.tableHeaders.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overduePagination.items.map((order) => (
                        <tr key={order.orderId} className="border-b border-border/70 last:border-0">
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs text-muted-foreground">{order.orderCode}</span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">{order.customerName}</p>
                            <p>{order.customerPhone ?? "-"}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {formatDateLabel(order.startDate, { locale })} - {" "}
                            {formatDateLabel(order.endDate, { locale })}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {formatDateTimeLabel(order.updatedAt, locale)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/${locale}/orders/${order.orderId}`}
                                className="rounded-lg border border-border px-2.5 py-1 font-semibold"
                              >
                                {copy.openAction}
                              </Link>
                              <button
                                type="button"
                                disabled={Boolean(runningOrderId) || quickReturnMutation.isPending}
                                onClick={() => void handleQuickReturn(order.orderId)}
                                className="rounded-lg border border-border px-2.5 py-1 font-semibold disabled:opacity-50"
                              >
                                {copy.returnAction}
                              </button>
                            </div>
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
                      setOverduePage(Math.max(1, overduePagination.page - 1))
                    }
                    disabled={overduePagination.page <= 1}
                    className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                  >
                    {prevLabel}
                  </button>
                  <span>
                    {paginationLabel} {overduePagination.page}/{overduePagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOverduePage(
                        Math.min(overduePagination.totalPages, overduePagination.page + 1)
                      )
                    }
                    disabled={overduePagination.page >= overduePagination.totalPages}
                    className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                  >
                    {nextLabel}
                  </button>
                </div>
              </>
            )}
          </article>
        </div>

        <aside className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{copy.recentActivitiesTitle}</h2>

          {overview.recentActivities.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
              {copy.activitiesEmpty}
            </p>
          ) : (
            overview.recentActivities.map((activity) => {
              const style = resolveActivityStyle(activity.action);
              const Icon = style.icon;

              return (
                <article
                  key={activity.id}
                  className={`rounded-xl border p-3 shadow-sm ${style.containerClassName}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClassName}`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 text-xs md:flex-row md:items-center md:justify-between">
                        <p className="font-semibold text-foreground">
                          {activityLabelResolver(activity.action, activity.entityType)}
                        </p>
                        <p className="text-muted-foreground">
                          {formatDateTimeLabel(activity.createdAt, locale)}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {activity.actorName ?? copy.unknownActor}
                        {activity.reason ? ` - ${activity.reason}` : ""}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </aside>
      </section>
    </div>
  );
});
