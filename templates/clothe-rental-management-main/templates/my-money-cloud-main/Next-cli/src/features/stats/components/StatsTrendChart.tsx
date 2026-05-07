"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { DailyTrendItem } from "@/features/stats/types";

interface StatsTrendChartProps {
  data: DailyTrendItem[];
  hasData: boolean;
}

const CHART_COLORS = {
  income: "hsl(var(--success))",
  expense: "hsl(var(--destructive))",
};

export function StatsTrendChart({ data, hasData }: StatsTrendChartProps) {
  const { t, language } = useI18n();

  if (!hasData) {
    return (
      <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle className="text-lg">{t("stats.trendTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-sm">{t("stats.noTrendData")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">{t("stats.trendTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("stats.trendSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS.income }} />
            <span className="text-muted-foreground">{t("stats.trendLegendIncome")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS.expense }} />
            <span className="text-muted-foreground">{t("stats.trendLegendExpense")}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.expense} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.expense} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => formatCompactNumber(Number(value), language)}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke={CHART_COLORS.income}
                fill="url(#incomeFill)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke={CHART_COLORS.expense}
                fill="url(#expenseFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
