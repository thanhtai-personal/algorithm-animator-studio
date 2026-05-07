import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodBarChart2 } from "./PeriodBarChart2";
import type { PeriodMode } from "../hooks/useProStatsData";
import { cn } from "@/utils";

interface StatsPeriodCardProps {
  t: (key: string) => string;
  periodOptions: Array<{ value: PeriodMode; label: string }>;
  periodMode: PeriodMode;
  setPeriodMode: (mode: PeriodMode) => void;
  renderRangePicker: (range: any, onChange: (v: any) => void) => React.ReactNode;
  periodRange: any;
  onPeriodRangeChange: (value: any) => void;
  periodData: Array<{ label: string; date: Date; income: number; expense: number }>;
  periodDomainMax: number;
  periodChartHeight: number;
}

export function StatsPeriodCard({
  t,
  periodOptions,
  periodMode,
  setPeriodMode,
  renderRangePicker,
  periodRange,
  onPeriodRangeChange,
  periodData,
  periodDomainMax,
  periodChartHeight,
}: StatsPeriodCardProps) {
  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg">{t("stats.periodChartTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("stats.periodChartSubtitle")}</p>
        </div>
        <div className="flex gap-2 flex-col items-end">
          <div className="flex flex-wrap w-fit gap-1 justify-end rounded-xl border border-border/50 bg-muted/60 p-1 dark:bg-muted/30">
            {periodOptions.map((option) => {
              const isActive = periodMode === option.value;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-semibold shadow-none",
                    isActive
                      ? "bg-card text-foreground shadow-sm dark:bg-muted/40"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-muted/30"
                  )}
                  onClick={() => setPeriodMode(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
          {renderRangePicker(periodRange, onPeriodRangeChange)}
          <p className="text-xs text-muted-foreground hidden sm:block">{t("stats.rangeLimitHint")}</p>
        </div>
      </CardHeader>
      <CardContent>
        {periodData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <span className="text-2xl">📊</span>
            <p className="text-sm">{t("stats.noData")}</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-2">
            <div style={{ height: periodChartHeight }}>
              <PeriodBarChart2 periodData={periodData} periodDomainMax={periodDomainMax} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
