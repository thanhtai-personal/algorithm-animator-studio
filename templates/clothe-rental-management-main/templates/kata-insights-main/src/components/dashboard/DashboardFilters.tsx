import { useState } from "react";
import { cn } from "@/lib/utils";

const periods = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "month", label: "Tháng này" },
];

interface DashboardFiltersProps {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
}

const DashboardFilters = ({ activePeriod, onPeriodChange }: DashboardFiltersProps) => {
  return (
    <div className="px-4 py-2">
      <div className="flex gap-1 p-1 bg-surface-sunken rounded-lg">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all",
              activePeriod === p.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardFilters;
