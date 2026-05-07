"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCompactNumber } from "@/lib/currency";
import { formatMonthYear } from "@/lib/date";
import { useI18n } from "@/lib/i18n";
import type { DashboardStats } from "@/features/transactions/types";

interface ProfileStatsCardProps {
  stats: DashboardStats;
  selectedMonth: Date;
}

export function ProfileStatsCard({ stats, selectedMonth }: ProfileStatsCardProps) {
  const { t, language, locale, localeCode, currency } = useI18n();
  const monthLabel = formatMonthYear(selectedMonth, { language, locale });

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "120ms" }}>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.monthlySummary")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("profile.monthLabel", { month: monthLabel })}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{t("dashboard.currentBalance")}</p>
            <p className="mt-2 text-sm font-semibold">
              {formatCurrency(stats.balance, currency, localeCode)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{t("dashboard.statsTransactions")}</p>
            <p className="mt-2 text-sm font-semibold">{stats.transactionCount}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-success/10 p-3">
            <p className="text-xs text-success">{t("dashboard.income")}</p>
            <p className="mt-2 text-sm font-semibold text-success">
              +{formatCompactNumber(stats.totalIncome, language)}
            </p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3">
            <p className="text-xs text-primary">{t("dashboard.expense")}</p>
            <p className="mt-2 text-sm font-semibold text-primary">
              -{formatCompactNumber(stats.totalExpense, language)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
