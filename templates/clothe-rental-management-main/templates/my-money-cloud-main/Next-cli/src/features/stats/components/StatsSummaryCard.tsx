import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpensePieChart } from "./IncomeExpensePieChart";

interface StatsSummaryCardProps {
  totals: { income: number; expense: number };
  renderRangePicker: (range: any, onChange: (v: any) => void) => React.ReactNode;
  summaryRange: any;
  onSummaryRangeChange: (value: any) => void;
  t: (key: string) => string;
}

export function StatsSummaryCard({
  totals,
  renderRangePicker,
  summaryRange,
  onSummaryRangeChange,
  t,
}: StatsSummaryCardProps) {
  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">{t("stats.incomeExpensePie")}</CardTitle>
        <div className="flex flex-col gap-1 sm:items-end">
          {renderRangePicker(summaryRange, onSummaryRangeChange)}
          <p className="text-xs text-muted-foreground hidden sm:block">{t("stats.rangeLimitHint")}</p>
        </div>
      </CardHeader>
      <CardContent>
        {totals.income === 0 && totals.expense === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <span className="text-2xl">🧮</span>
            <p className="text-sm">{t("stats.noData")}</p>
          </div>
        ) : (
          <div className="h-64">
            <IncomeExpensePieChart totals={totals} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
