"use client";

import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardStats } from "@/features/transactions/types";
import { useI18n } from "@/lib/i18n";

interface IncomeExpenseCompareProps {
  current: DashboardStats;
  previous: DashboardStats;
  loading?: boolean;
}

const COLORS = {
  income: "hsl(var(--success))",
  expense: "hsl(var(--destructive))",
};

export function IncomeExpenseCompare({ current, previous, loading }: IncomeExpenseCompareProps) {
  const { t, localeCode, language } = useI18n();

  const formatAmount = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    if (language === "vi") {
      const abs = Math.abs(value);
      const format = (num: number) => {
        const rounded = Math.round(num * 10) / 10;
        return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
      };
      if (abs >= 1_000_000_000) return `${format(value / 1_000_000_000)} tỷ`;
      if (abs >= 1_000_000) return `${format(value / 1_000_000)} triệu`;
      if (abs >= 1_000) return `${format(value / 1_000)} nghìn`;
    }
    return new Intl.NumberFormat(localeCode, { notation: "compact", maximumFractionDigits: 1 }).format(
      value
    );
  };

  const safeCurrentIncome = Number.isFinite(current.totalIncome) ? current.totalIncome : 0;
  const safeCurrentExpense = Number.isFinite(current.totalExpense) ? current.totalExpense : 0;
  const safePreviousIncome = Number.isFinite(previous.totalIncome) ? previous.totalIncome : 0;
  const safePreviousExpense = Number.isFinite(previous.totalExpense) ? previous.totalExpense : 0;

  const currentData = [
    { name: t("dashboard.income"), value: safeCurrentIncome, fill: COLORS.income },
    { name: t("dashboard.expense"), value: safeCurrentExpense, fill: COLORS.expense },
  ];
  const previousData = [
    { name: t("dashboard.income"), value: safePreviousIncome, fill: COLORS.income },
    { name: t("dashboard.expense"), value: safePreviousExpense, fill: COLORS.expense },
  ];

  const renderPanel = (data: Array<{ name: string; value: number; fill: string }>) => (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 p-4 lg:flex-row lg:items-center lg:gap-5">
      <div className="relative mx-auto h-40 w-40 flex-none sm:h-48 sm:w-48">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="70%"
                labelLine={false}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex-1 space-y-3">
        {data.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2"
          >
            <span
              className="h-3 w-3 rounded-full flex-none"
              style={{ backgroundColor: entry.fill }}
              aria-hidden
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(entry.value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card variant="elevated">
      <Tabs defaultValue="current" className="w-full">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">{t("dashboard.incomeExpenseCompare")}</CardTitle>
          <TabsList>
            <TabsTrigger value="current">{t("dashboard.thisMonthShort")}</TabsTrigger>
            <TabsTrigger value="previous">{t("dashboard.lastMonthShort")}</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="pt-0">
          <TabsContent value="current" className="mt-0">
            {renderPanel(currentData)}
          </TabsContent>
          <TabsContent value="previous" className="mt-0">
            {renderPanel(previousData)}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
