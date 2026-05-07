"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type AmountKeypadProps = {
  value: string;
  onChange: (next: string) => void;
  currency?: string;
  disabled?: boolean;
  className?: string;
};

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function AmountKeypad({ value, onChange, currency, disabled = false, className }: AmountKeypadProps) {
  const showTripleZero = (currency ?? "").toUpperCase() === "VND";

  const appendValue = (token: string) => {
    if (disabled) return;
    const base = value === "0" ? "" : value;
    onChange(`${base}${token}`);
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {DIGIT_ROWS.map((row) => (
        <div key={row.join("-")} className="grid grid-cols-3 gap-2">
          {row.map((digit) => (
            <Button
              key={digit}
              type="button"
              variant="secondary"
              className="h-12 rounded-xl text-lg font-semibold"
              onClick={() => appendValue(digit)}
              disabled={disabled}
            >
              {digit}
            </Button>
          ))}
        </div>
      ))}

      <div className="grid grid-cols-3 gap-2">
        {showTripleZero ? (
          <Button
            type="button"
            variant="secondary"
            className="h-12 rounded-xl text-base font-semibold"
            onClick={() => appendValue("000")}
            disabled={disabled}
          >
            000
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl text-base font-semibold"
            onClick={handleClear}
            disabled={disabled}
          >
            C
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          className="h-12 rounded-xl text-lg font-semibold"
          onClick={() => appendValue("0")}
          disabled={disabled}
        >
          0
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={handleBackspace}
          disabled={disabled}
          aria-label="Backspace"
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
