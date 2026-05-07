"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

interface ExpenseChartProps {
  data: CategoryStat[];
  onCategorySelect?: (categoryId: string) => void;
}

export function ExpenseChart({ data, onCategorySelect }: ExpenseChartProps) {
  const { t, localeCode, currency } = useI18n();
  const isInteractive = Boolean(onCategorySelect);

  if (data.length === 0) {
    return (
      <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.expenseByCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-sm">{t('dashboard.noExpenseData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">{t('dashboard.expenseByCategory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {data.map((item) => (
            <button
              key={item.categoryId}
              type="button"
              onClick={() => onCategorySelect?.(item.categoryId)}
              className={cn(
                "w-full rounded-2xl border border-border/70 bg-muted/40 p-3 text-left transition hover:border-primary/60",
                isInteractive ? "" : "cursor-default"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{item.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.percentage.toFixed(0)}%
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {formatCurrency(item.amount, currency, localeCode)}
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, Math.min(100, item.percentage))}%`,
                    background: `linear-gradient(90deg, hsl(var(--${item.color})) 0%, hsl(var(--${item.color}) / 0.7) 100%)`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
