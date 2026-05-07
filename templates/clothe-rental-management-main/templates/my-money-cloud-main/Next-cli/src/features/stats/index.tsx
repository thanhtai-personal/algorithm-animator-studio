"use client";

import { useMemo, useState } from "react";
import { QuickStats } from "@/features/dashboard/components/QuickStats";
import { ExpenseChart } from "@/features/dashboard/components/ExpenseChart";
import { StatsInsights } from "@/features/stats/components/StatsInsights";
import { StatsTrendChart } from "@/features/stats/components/StatsTrendChart";
import { CategoryTransactionsModal } from "@/features/stats/components/CategoryTransactionsModal";
import { StatsTransactionList } from "@/features/stats/components/StatsTransactionList";
import { useStats } from "@/features/stats/hooks/useStats";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useI18n } from "@/lib/i18n";
import type { DashboardStats, Transaction } from "@/features/transactions/types";
import type { CategoryStat } from "@/features/stats/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";

interface StatsPageProps {
  transactions: Transaction[];
  stats: DashboardStats;
  categoryStats: CategoryStat[];
  selectedMonth: Date;
  previousStats?: DashboardStats;
  loading?: boolean;
}

export const StatsPage = observer(function StatsPage({
  transactions,
  stats,
  categoryStats,
  selectedMonth,
  previousStats,
  loading = false,
}: StatsPageProps) {
  const { t } = useI18n();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const selectedCategory = useMemo(
    () => categoryStats.find((item) => item.categoryId === selectedCategoryId) ?? null,
    [categoryStats, selectedCategoryId]
  );
  const loadingLabel = t("common.loading");
  const { dailyTrend, highlights, hasTrendData } = useStats({
    transactions,
    categoryStats,
    selectedMonth,
    totalIncome: stats.totalIncome,
    totalExpense: stats.totalExpense,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{t("stats.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("stats.subtitle")}</p>
      </div>

      {loading ? (
        <QuickStatsLoading label={loadingLabel} />
      ) : (
        <QuickStats
          totalIncome={stats.totalIncome}
          totalExpense={stats.totalExpense}
          transactionCount={stats.transactionCount}
          previousIncome={previousStats?.totalIncome}
          previousExpense={previousStats?.totalExpense}
        />
      )}

      {loading ? (
        <InsightsLoading title={t("stats.insightsTitle")} label={loadingLabel} />
      ) : (
        <StatsInsights
          averageDailyIncome={highlights.averageDailyIncome}
          averageDailyExpense={highlights.averageDailyExpense}
          topCategory={highlights.topCategory}
          topExpense={highlights.topExpense}
        />
      )}

      {loading ? (
        <ChartLoading title={t("stats.trendTitle")} label={loadingLabel} />
      ) : (
        <StatsTrendChart data={dailyTrend} hasData={hasTrendData} />
      )}

      {loading ? (
        <ChartLoading title={t("dashboard.expenseByCategory")} label={loadingLabel} />
      ) : (
        <ExpenseChart
          data={categoryStats}
          onCategorySelect={(categoryId) => setSelectedCategoryId(categoryId)}
        />
      )}

      <StatsTransactionList
        transactions={transactions}
        selectedMonth={selectedMonth}
        loading={loading}
      />

      <CategoryTransactionsModal
        open={Boolean(selectedCategoryId)}
        onClose={() => setSelectedCategoryId(null)}
        categoryId={selectedCategoryId}
        categoryName={selectedCategory?.categoryName}
        month={selectedMonth}
      />
    </div>
  );
})

function QuickStatsLoading({ label }: { label: string }) {
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

function InsightsLoading({ title, label }: { title: string; label: string }) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartLoading({ title, label }: { title: string; label: string }) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
