"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {  Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionDetailDialog } from "@/features/transactions/components/TransactionDetailDialog";
import { EditTransactionModal } from "@/features/transactions/components/EditTransactionModal";
import { QuickStats } from "@/features/dashboard/components/QuickStats";
import { formatCurrency } from "@/lib/currency";
import { useProStatsData } from "../hooks/useProStatsData";
import type { PeriodMode, CategoryChartMode } from "../hooks/useProStatsData";
import { useStatsTransactionActions } from "../hooks/useStatsTransactionActions";
import { StatsRangePicker } from "./StatsRangePicker";
import { StatsSummaryCard } from "./StatsSummaryCard";
import { StatsPeriodCard } from "./StatsPeriodCard";
import { StatsCategoryCard } from "./StatsCategoryCard";
import { CategoryManager } from "./CategoryManager";
import { TransactionManager } from "./TransactionManager";
import { TransactionDeleteDialog } from "./TransactionDeleteDialog";
import { observer } from "mobx-react-lite";

export const ProStatsPage = observer(function ProStatsPage() {
  const data = useProStatsData();
  const { i18n, summary, period, category, list, detail, categoryMap, formatRangeValue } = data;
  const { t, dateFormat, dateTimeFormat, locale, language, localeCode, currency } = i18n;
  const txActions = useStatsTransactionActions();
  const { current: serverCurrent, previous: serverPrevious, loading: serverLoading, error: serverError, lastUpdated } =
    summary.server;
  const hasLocalSummary = summary.local.transactionCount > 0;
  const showLocalSummary = !serverCurrent && hasLocalSummary;
  const netThisMonth = serverCurrent
    ? serverCurrent.totalIncome - serverCurrent.totalExpense
    : showLocalSummary
      ? summary.local.totalIncome - summary.local.totalExpense
      : null;

  const renderRangePicker = useMemo(
    () =>
      (range: any, onChange: (value: any) => void) => (
        <StatsRangePicker
          range={range}
          onChange={onChange}
          displayLabel={range?.from ? formatRangeValue(range, dateFormat, locale) : "All time"}
        />
      ),
    [dateFormat, formatRangeValue, locale]
  );

  const periodOptions: Array<{ value: PeriodMode; label: string }> = [
    { value: "day", label: t("common.day") },
    { value: "month", label: t("common.month") },
    { value: "year", label: t("common.year") },
  ];
  const categoryChartOptions: Array<{ value: CategoryChartMode; label: string }> = [
    { value: "pie", label: t("stats.chartModePie") },
    { value: "bar", label: t("stats.chartModeBar") },
  ];

  return (
    <div className="space-y-6 pb-32">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{t("stats.proTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("stats.proSubtitle")}</p>
      </div>

      <Card variant="elevated" className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t("stats.summaryTitle") || "This month"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("stats.summarySubtitle") || "Server-calculated monthly summary"}
            </p>
          </div>
          {lastUpdated ? (
            <span className="text-xs text-muted-foreground">{t("common.updated") || "Updated"}: {format(new Date(lastUpdated), "PPpp")}</span>
          ) : null}
        </CardHeader>
        <CardContent>
          {serverLoading && !serverCurrent && !showLocalSummary ? (
            <SummaryLoading label={t("common.loading")} />
          ) : serverCurrent ? (
            <QuickStats
              totalIncome={serverCurrent.totalIncome}
              totalExpense={serverCurrent.totalExpense}
              transactionCount={serverCurrent.transactionCount}
              previousIncome={serverPrevious?.totalIncome}
              previousExpense={serverPrevious?.totalExpense}
            />
          ) : showLocalSummary ? (
            <QuickStats
              totalIncome={summary.local.totalIncome}
              totalExpense={summary.local.totalExpense}
              transactionCount={summary.local.transactionCount}
            />
          ) : serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("stats.noData") || "No stats available yet."}</p>
          )}
          {netThisMonth !== null ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("stats.netThisMonth")}</span>
              <span className="text-base font-semibold">
                {formatCurrency(netThisMonth, currency, localeCode)}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <StatsSummaryCard
        totals={summary.totals}
        renderRangePicker={renderRangePicker}
        summaryRange={summary.range}
        onSummaryRangeChange={summary.setRange}
        t={t}
      />

      <StatsPeriodCard
        t={t}
        periodOptions={periodOptions}
        periodMode={period.mode}
        setPeriodMode={period.setMode}
        renderRangePicker={renderRangePicker}
        periodRange={period.range}
        onPeriodRangeChange={period.setRange}
        periodData={period.data}
        periodDomainMax={period.domainMax}
        periodChartHeight={period.chartHeight}
      />

      <StatsCategoryCard
        t={t}
        categoryChartOptions={categoryChartOptions}
        categoryChartMode={category.chartMode}
        setCategoryChartMode={category.setChartMode}
        renderRangePicker={renderRangePicker}
        categoryRange={category.range}
        onCategoryRangeChange={category.setRange}
        categoryData={category.data}
        incomePieData={category.incomePieData}
        expensePieData={category.expensePieData}
        categoryChartData={category.chartData}
        categoryDomainMax={category.domainMax}
        categoryChartHeight={category.chartHeight}
        language={language}
      />

      <Card variant="elevated" className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-lg">{t("manage.categoriesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <CategoryManager />
        </CardContent>
      </Card>

      <Card variant="elevated" className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-lg">{t("manage.transactionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <TransactionManager />
        </CardContent>
      </Card>

      <TransactionDetailDialog transaction={detail.transaction} onClose={() => detail.setTransaction(null)} />
      <EditTransactionModal
        open={Boolean(txActions.editTarget)}
        transaction={txActions.editTarget}
        onClose={() => txActions.setEditTarget(null)}
        onSave={txActions.handleSave}
        isSaving={false}
      />
      <TransactionDeleteDialog
        open={Boolean(txActions.deleteTarget)}
        onOpenChange={(open) => !open && txActions.setDeleteTarget(null)}
        onConfirm={txActions.handleDelete}
        labels={{
          title: t("transactions.deleteTitle"),
          cancel: t("common.cancel"),
          confirm: t("transactions.deleteAction"),
        }}
      />
    </div>
  );
});

function SummaryLoading({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} variant="elevated" className="p-4">
          <div className="flex min-h-[86px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">{label}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
