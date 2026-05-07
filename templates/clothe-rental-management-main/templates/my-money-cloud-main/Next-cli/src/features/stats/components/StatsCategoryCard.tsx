import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, BarChart3 } from "lucide-react";
import { CHART_COLORS } from "../constants";
import { CategoryPieChart } from "./CategoryPieChart";
import { ExpensePieChart } from "./ExpensePieChart";
import { formatCompactNumber } from "@/lib/currency";
import type { CategoryChartMode } from "../hooks/useProStatsData";
import { cn } from "@/utils";

interface StatsCategoryCardProps {
  t: (key: string) => string;
  categoryChartOptions: Array<{ value: CategoryChartMode; label: string }>;
  categoryChartMode: CategoryChartMode;
  setCategoryChartMode: (mode: CategoryChartMode) => void;
  renderRangePicker: (range: any, onChange: (v: any) => void) => ReactNode;
  categoryRange: any;
  onCategoryRangeChange: (value: any) => void;
  categoryData: any[];
  incomePieData: any[];
  expensePieData: any[];
  categoryChartData: any[];
  categoryDomainMax: number;
  categoryChartHeight: number;
  language: string;
}

export function StatsCategoryCard({
  t,
  categoryChartOptions,
  categoryChartMode,
  setCategoryChartMode,
  renderRangePicker,
  categoryRange,
  onCategoryRangeChange,
  categoryData,
  incomePieData,
  expensePieData,
  categoryChartData,
  categoryDomainMax,
  categoryChartHeight,
  language,
}: StatsCategoryCardProps) {
  const safeLanguage = language as "vi" | "en" | "zh" | "ko" | "ja" | "hi" | undefined;
  const safeDomainMax = categoryDomainMax > 0 ? categoryDomainMax : 1;
  const toPercent = (value: number) =>
    Math.min(100, Math.max(0, (value / safeDomainMax) * 100));
  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">{t("stats.categoryChartTitle")}</CardTitle>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center justify-between gap-2">
            {renderRangePicker(categoryRange, onCategoryRangeChange)}
            <div className="flex items-center justify-end gap-1 rounded-full border border-border/50 bg-muted/60 p-1 dark:bg-muted/30">
              {categoryChartOptions.map((option) => {
                const isActive = categoryChartMode === option.value;
                const Icon = option.value === "pie" ? PieChart : BarChart3;
                return (
                  <Button
                    key={option.value}
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-8 w-8 rounded-full shadow-none",
                      isActive
                        ? "bg-card text-foreground shadow-sm dark:bg-muted/40"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-muted/30"
                    )}
                    onClick={() => setCategoryChartMode(option.value)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">{t("stats.rangeLimitHint")}</p>
        </div>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <span className="text-2xl">📦</span>
            <p className="text-sm">{t("stats.noData")}</p>
          </div>
        ) : categoryChartMode === "pie" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <PieColumn
              title={t("dashboard.income")}
              pieData={incomePieData}
              renderPie={() => <CategoryPieChart incomePieData={incomePieData} />}
            />
            <PieColumn
              title={t("dashboard.expense")}
              pieData={expensePieData}
              renderPie={() => <ExpensePieChart expensePieData={expensePieData} />}
            />
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-2">
            <div className="space-y-1.5" style={{ minHeight: categoryChartHeight }}>
              {categoryChartData.map((item) => {
                const expenseValue = Math.max(0, Number(item.expenseLabel ?? 0));
                const incomeValue = Math.max(0, Number(item.incomeLabel ?? 0));
                const expenseWidth = toPercent(expenseValue);
                const incomeWidth = toPercent(incomeValue);
                return (
                  <div
                    key={item.categoryId}
                    className="grid grid-cols-[1fr_minmax(64px,92px)_1fr] sm:grid-cols-[1fr_minmax(96px,128px)_1fr] items-center gap-0.5 sm:gap-1"
                  >
                    <div
                      className="flex items-center justify-end gap-0.5 rounded-sm px-1 py-0.5"
                      style={{ backgroundColor: "hsla(var(--destructive), 0.12)" }}
                    >
                      {expenseValue > 0 ? (
                        <>
                          <span className="text-[11px] text-muted-foreground">
                            {formatCompactNumber(expenseValue, safeLanguage)}
                          </span>
                          <div
                            className="h-4 rounded-l-md"
                            style={{
                              width: `${expenseWidth}%`,
                              backgroundColor: CHART_COLORS.expense,
                            }}
                          />
                        </>
                      ) : (
                        <div className="h-4" />
                      )}
                    </div>
                    <div
                      className="text-center text-[11px] sm:text-xs font-medium text-muted-foreground truncate px-1 py-0.5 leading-tight rounded-sm"
                      style={{ backgroundColor: "hsla(var(--muted), 0.7)" }}
                    >
                      {item.categoryName}
                    </div>
                    <div
                      className="flex items-center gap-0.5 rounded-sm px-1 py-0.5"
                      style={{ backgroundColor: "hsla(var(--success), 0.12)" }}
                    >
                      {incomeValue > 0 ? (
                        <>
                          <div
                            className="h-4 rounded-r-md"
                            style={{
                              width: `${incomeWidth}%`,
                              backgroundColor: CHART_COLORS.income,
                            }}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {formatCompactNumber(incomeValue, safeLanguage)}
                          </span>
                        </>
                      ) : (
                        <div className="h-4" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PieColumn({
  title,
  pieData,
  renderPie,
}: {
  title: string;
  pieData: any[];
  renderPie: () => ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-center">{title}</p>
      <div className="h-56">
        {pieData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-36 w-36 rounded-full border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              0
            </div>
          </div>
        ) : (
          renderPie()
        )}
      </div>
      <div className="grid gap-2 text-xs">
        {pieData.slice(0, 5).map((item) => (
          <div key={item.categoryId} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate">{item.name}</span>
          </div>
        ))}
        {pieData.length > 5 ? (
          <span className="text-muted-foreground">+{pieData.length - 5}</span>
        ) : null}
      </div>
    </div>
  );
}
