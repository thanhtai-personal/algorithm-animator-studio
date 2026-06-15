import * as React from "react";
import { cn } from "@/lib/utils";

type SegmentedTabOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

type SegmentedTabsProps<T extends string> = {
  value: T;
  options: SegmentedTabOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
  "aria-label"?: string;
};

function SegmentedTabs<T extends string>({
  value,
  options,
  onValueChange,
  className,
  buttonClassName,
  "aria-label": ariaLabel,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 shadow-inner", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            className={cn(
              "h-8 min-w-24 rounded-full px-4 text-xs font-semibold text-muted-foreground transition-all",
              "hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
              active && "bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.45)] hover:bg-primary hover:text-primary-foreground",
              buttonClassName,
            )}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedTabs, type SegmentedTabOption };
