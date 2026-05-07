"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import type { DateRangeValue } from "@/types/domainPrimitives";
import { validateDateRange } from "@/utils/validation/dateRange";
import { cn } from "@/utils/className";
import type { AppLocale } from "@/constants/locale";

const RANGE_ERROR_MESSAGES: Record<AppLocale, Record<string, string>> = {
  vi: {
    "empty-start-date": "Vui lòng chọn ngày bắt đầu.",
    "empty-end-date": "Vui lòng chọn ngày kết thúc.",
    "invalid-start-date": "Ngày bắt đầu không hợp lệ.",
    "invalid-end-date": "Ngày kết thúc không hợp lệ.",
    "end-before-start": "Ngày kết thúc phải từ ngày bắt đầu trở đi.",
    "same-day-not-allowed": "Khoảng ngày cần khác ngày.",
  },
  en: {
    "empty-start-date": "Please select a start date.",
    "empty-end-date": "Please select an end date.",
    "invalid-start-date": "Start date is invalid.",
    "invalid-end-date": "End date is invalid.",
    "end-before-start": "End date must be on or after start date.",
    "same-day-not-allowed": "Date range must contain at least two different dates.",
  },
};

interface DateRangeFieldProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  locale?: AppLocale;
  allowEmpty?: boolean;
  allowSameDay?: boolean;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
  variant?: "default" | "compact";
  className?: string;
}

export function DateRangeField({
  value,
  onChange,
  locale = "vi",
  allowEmpty = false,
  allowSameDay = true,
  startLabel,
  endLabel,
  disabled = false,
  variant = "default",
  className,
}: DateRangeFieldProps) {
  const validation = useMemo(
    () => validateDateRange(value, { allowEmpty, allowSameDay }),
    [allowEmpty, allowSameDay, value]
  );

  const labels = {
    start: startLabel ?? (locale === "vi" ? "Từ ngày" : "Start date"),
    end: endLabel ?? (locale === "vi" ? "Đến ngày" : "End date"),
  };

  const inputClassName = cn(
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-offset-background transition-colors focus:ring-2 focus:ring-ring",
    disabled && "cursor-not-allowed bg-muted text-muted-foreground"
  );

  const compactInputClassName = cn(
    "h-7 rounded border border-border bg-background px-2 text-xs text-foreground outline-none ring-offset-background transition-colors focus:ring-2 focus:ring-ring",
    disabled && "cursor-not-allowed bg-muted text-muted-foreground"
  );

  return (
    <div className={cn("space-y-2", className)}>
      {variant === "compact" ? (
        <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="hidden sm:inline">{labels.start}</span>
          <input
            type="date"
            value={value.startDate}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                startDate: event.target.value,
              })
            }
            className={compactInputClassName}
          />
          <span>-</span>
          <span className="hidden sm:inline">{labels.end}</span>
          <input
            type="date"
            value={value.endDate}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                endDate: event.target.value,
              })
            }
            className={compactInputClassName}
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.start}
            </span>
            <input
              type="date"
              value={value.startDate}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  startDate: event.target.value,
                })
              }
              className={inputClassName}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.end}
            </span>
            <input
              type="date"
              value={value.endDate}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  endDate: event.target.value,
                })
              }
              className={inputClassName}
            />
          </label>
        </div>
      )}

      {!validation.isValid && validation.error ? (
        <p className="text-xs text-destructive">{RANGE_ERROR_MESSAGES[locale][validation.error]}</p>
      ) : null}
    </div>
  );
}
