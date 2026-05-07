"use client";

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Receipt, type LucideIcon } from 'lucide-react';
import { formatCompactNumber } from '@/lib/currency';
import { cn } from '@/utils';
import { useI18n } from '@/lib/i18n';

interface QuickStatsProps {
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  previousIncome?: number;
  previousExpense?: number;
}

export function QuickStats({
  totalIncome,
  totalExpense,
  transactionCount,
  previousIncome,
  previousExpense,
}: QuickStatsProps) {
  const { t, language } = useI18n();

  const colorClasses = {
    success: { bg: 'bg-success/10', text: 'text-success', card: 'bg-success/10 border border-success/20' },
    destructive: { bg: 'bg-destructive/10', text: 'text-destructive', card: 'bg-destructive/10 border border-destructive/20' },
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary', card: 'bg-secondary/10 border border-secondary/20' },
  } as const;

  type StatColor = keyof typeof colorClasses;

  const formatTrendLabel = (value: number) => {
    const formatter = new Intl.NumberFormat(language, { maximumFractionDigits: 0 });
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}${formatter.format(Math.abs(value))}%`;
  };

  const buildTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    if (previous === 0) {
      if (current === 0) {
        return { value: 0, isIncrease: true };
      }
      return { value: 100, isIncrease: current > 0 };
    }
    const percent = ((current - previous) / Math.abs(previous)) * 100;
    return { value: percent, isIncrease: percent >= 0 };
  };

  const incomeTrend = buildTrend(totalIncome, previousIncome);
  const expenseTrend = buildTrend(totalExpense, previousExpense);

  const stats: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    color: StatColor;
    trend?: string;
    trendUp?: boolean;
  }> = [
    {
      label: t('dashboard.statsIncome'),
      value: totalIncome,
      icon: TrendingUp,
      color: 'success',
      trend: incomeTrend ? formatTrendLabel(incomeTrend.value) : undefined,
      trendUp: incomeTrend?.isIncrease,
    },
    {
      label: t('dashboard.statsExpense'),
      value: totalExpense,
      icon: TrendingDown,
      color: 'destructive',
      trend: expenseTrend ? formatTrendLabel(expenseTrend.value) : undefined,
      trendUp: expenseTrend?.isIncrease,
    },
    {
      label: t('dashboard.statsTransactions'),
      value: transactionCount,
      icon: Receipt,
      color: 'secondary',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          variant="elevated"
          className={cn("p-4 animate-slide-up", colorClasses[stat.color].card)}
          style={{ animationDelay: `${(index + 3) * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center',
                colorClasses[stat.color].bg
              )}
            >
              <stat.icon
                className={cn(
                  'w-4 h-4',
                  colorClasses[stat.color].text
                )}
              />
            </div>
            {stat.trend && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
                  stat.trendUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                )}
              >
                {stat.trendUp ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.trend}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
          <p className="text-lg font-bold">{formatCompactNumber(stat.value, language)}</p>
        </Card>
      ))}
    </div>
  );
}
