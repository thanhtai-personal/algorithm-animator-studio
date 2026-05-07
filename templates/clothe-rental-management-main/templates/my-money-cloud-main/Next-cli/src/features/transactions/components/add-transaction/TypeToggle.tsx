"use client";

import { cn } from "@/utils";
import type { TransactionType } from "@/features/transactions/types";

type TypeToggleProps = {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  expenseLabel: string;
  incomeLabel: string;
};

export function TypeToggle({ value, onChange, expenseLabel, incomeLabel }: TypeToggleProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-2xl">
      <button
        onClick={() => onChange("expense")}
        className={cn(
          "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border",
          value === "expense"
            ? "bg-red-500 text-white shadow-lg border-red-600"
            : "text-muted-foreground hover:text-foreground border-transparent bg-muted/40",
        )}
      >
        {expenseLabel}
      </button>
      <button
        onClick={() => onChange("income")}
        className={cn(
          "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border",
          value === "income"
            ? "bg-green-500 text-white shadow-lg border-green-600"
            : "text-muted-foreground hover:text-foreground border-transparent bg-muted/40",
        )}
      >
        {incomeLabel}
      </button>
    </div>
  );
}
