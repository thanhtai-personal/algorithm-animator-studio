"use client";

import { useMemo } from "react";
import { cn } from "@/utils/className";

export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  className?: string;
}

export function FilterChips({
  options,
  selectedValues,
  onToggle,
  className,
}: FilterChipsProps) {
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selectedSet.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() => onToggle(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {option.label}
            {typeof option.count === "number" ? ` (${option.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
