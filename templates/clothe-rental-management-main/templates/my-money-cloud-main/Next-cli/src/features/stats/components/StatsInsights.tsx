"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import type { HighlightCategory, HighlightTransaction } from "@/features/stats/types";

interface StatsInsightsProps {
  averageDailyIncome: number;
  averageDailyExpense: number;
  topCategory?: HighlightCategory;
  topExpense?: HighlightTransaction;
}

export function StatsInsights({
  averageDailyIncome,
  averageDailyExpense,
  topCategory,
  topExpense,
}: StatsInsightsProps) {
  const { t, localeCode, currency } = useI18n();

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "150ms" }}>
      <CardHeader>
        <CardTitle className="text-lg">{t("stats.insightsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t("stats.avgDailyExpense")}</p>
          <p className="text-base font-semibold">
            {formatCurrency(averageDailyExpense, currency, localeCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t("stats.avgDailyIncome")}</p>
          <p className="text-base font-semibold">
            {formatCurrency(averageDailyIncome, currency, localeCode)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/50 p-3 sm:col-span-2">
          <p className="text-xs text-muted-foreground">{t("stats.topCategory")}</p>
          {topCategory ? (
            <div className="mt-2 flex items-center gap-3">
              <CategoryIcon icon={topCategory.icon} color={topCategory.color} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{topCategory.categoryName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(topCategory.amount, currency, localeCode)} • {topCategory.percentage.toFixed(0)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("stats.noData")}</p>
          )}
        </div>
        <div className="rounded-2xl bg-muted/50 p-3 sm:col-span-2">
          <p className="text-xs text-muted-foreground">{t("stats.topExpense")}</p>
          {topExpense ? (
            <div className="mt-2 flex items-center gap-3">
              <CategoryIcon icon={topExpense.categoryIcon} color={topExpense.categoryColor} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{topExpense.description}</p>
                <p className="text-xs text-muted-foreground">
                  {topExpense.categoryName} • {formatCurrency(topExpense.amount, currency, localeCode)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("stats.noData")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
