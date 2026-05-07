import { TrendingUp, TrendingDown } from "lucide-react";
import { kpiData, formatMoney } from "@/data/mockData";
import { cn } from "@/lib/utils";

const kpiConfig = [
  { key: "revenue" as const, colorClass: "text-success", bgClass: "bg-success/10", borderClass: "border-success/20" },
  { key: "profit" as const, colorClass: "text-kpi-profit", bgClass: "bg-kpi-profit/10", borderClass: "border-kpi-profit/20" },
  { key: "deposit" as const, colorClass: "text-warning", bgClass: "bg-warning/10", borderClass: "border-warning/20" },
  { key: "debt" as const, colorClass: "text-danger", bgClass: "bg-danger/10", borderClass: "border-danger/20" },
];

const KPIHeroGrid = () => {
  return (
    <div className="px-4 py-2">
      <div className="grid grid-cols-2 gap-2.5">
        {kpiConfig.map(({ key, colorClass, bgClass, borderClass }) => {
          const data = kpiData[key];
          const isPositiveChange = data.change > 0;
          const isDebt = key === "debt";
          const changeColor = isDebt
            ? (isPositiveChange ? "text-danger" : "text-success")
            : (isPositiveChange ? "text-success" : "text-danger");

          return (
            <div
              key={key}
              className={cn(
                "rounded-lg p-3 border transition-all",
                bgClass,
                borderClass
              )}
            >
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {data.label}
              </p>
              <p className={cn("text-xl font-bold mt-1 text-money leading-none", colorClass)}>
                {formatMoney(data.value)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                {data.sub}
              </p>
              <div className={cn("flex items-center gap-0.5 mt-1.5", changeColor)}>
                {isPositiveChange ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-[11px] font-semibold">
                  {isPositiveChange ? "+" : ""}{data.change}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPIHeroGrid;
