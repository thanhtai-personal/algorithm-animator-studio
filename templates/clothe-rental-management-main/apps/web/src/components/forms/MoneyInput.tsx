"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import type { SupportedCurrency } from "@/types/SupportedCurrency";
import {
  formatMoney,
  formatMoneyInputValue,
  parseNonNegativeMoney,
} from "@/utils/format/money";
import { cn } from "@/utils/className";

type MoneyInputError = "invalid-number" | "negative-not-allowed" | null;

interface MoneyInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  onValidationChange?: (error: MoneyInputError) => void;
  locale?: AppLocale;
  currency?: SupportedCurrency;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  showPreview?: boolean;
}

export function MoneyInput({
  value,
  onValueChange,
  onValidationChange,
  locale = "vi",
  currency = "VND",
  label,
  placeholder,
  disabled,
  className,
  inputClassName,
  showPreview = true,
}: MoneyInputProps) {
  const [inputValue, setInputValue] = useState<string>(() =>
    formatMoneyInputValue(value, { locale, currency })
  );
  const [isFocused, setIsFocused] = useState(false);

  const editableValue = useMemo(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return "";
    }
    return String(value);
  }, [value]);

  const formattedPreview = useMemo(
    () => formatMoney(value, { locale, currency }),
    [currency, locale, value]
  );
  const formattedValue = useMemo(
    () => formatMoneyInputValue(value, { locale, currency }),
    [currency, locale, value]
  );
  const visibleValue = isFocused ? inputValue : formattedValue;

  return (
    <label className={cn("block space-y-1", className)}>
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}

      <input
        type="text"
        inputMode="decimal"
        value={visibleValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setInputValue(editableValue);
          setIsFocused(true);
        }}
        onChange={(event) => {
          const nextRaw = event.target.value;
          setInputValue(nextRaw);

          const parsed = parseNonNegativeMoney(nextRaw);
          onValidationChange?.(parsed.error);

          if (!parsed.error) {
            onValueChange(parsed.value);
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          setInputValue(formattedValue);
        }}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
          inputClassName
        )}
      />

      {showPreview && formattedPreview ? (
        <p className="text-xs text-muted-foreground">{formattedPreview}</p>
      ) : null}
    </label>
  );
}
