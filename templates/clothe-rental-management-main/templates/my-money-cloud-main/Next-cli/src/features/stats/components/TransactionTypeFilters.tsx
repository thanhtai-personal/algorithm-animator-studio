"use client";

import { ArrowDownCircle, ArrowUpCircle, Check } from "lucide-react";

import { cn } from "@/utils";

type TransactionTypeFiltersProps = {
  t: (key: string) => string;
  filterIncome: boolean;
  filterExpense: boolean;
  onToggleIncome: () => void;
  onToggleExpense: () => void;
};

export function TransactionTypeFilters({ t, filterIncome, filterExpense, onToggleIncome, onToggleExpense }: TransactionTypeFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      <button
        type="button"
        onClick={onToggleExpense}
        className={cn(
          "relative p-4 rounded-2xl border-2 transition-all duration-200",
          "flex flex-col items-center gap-3",
          filterExpense ? "bg-red-500 border-red-500 text-white shadow-lg scale-[1.02]" : "bg-card border-border hover:border-red-300 hover:bg-red-50/50",
        )}
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", filterExpense ? "bg-white/20" : "bg-red-100")}>
          <ArrowDownCircle className={cn("h-6 w-6", filterExpense ? "text-white" : "text-red-500")} />
        </div>
        <p className={cn("text-sm font-semibold", filterExpense ? "text-white" : "text-foreground")}>{t("common.expense")}</p>
        {filterExpense ? (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : null}
      </button>

      <button
        type="button"
        onClick={onToggleIncome}
        className={cn(
          "relative p-4 rounded-2xl border-2 transition-all duration-200",
          "flex flex-col items-center gap-3",
          filterIncome ? "bg-green-500 border-green-500 text-white shadow-lg scale-[1.02]" : "bg-card border-border hover:border-green-300 hover:bg-green-50/50",
        )}
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", filterIncome ? "bg-white/20" : "bg-green-100")}>
          <ArrowUpCircle className={cn("h-6 w-6", filterIncome ? "text-white" : "text-green-500")} />
        </div>
        <p className={cn("text-sm font-semibold", filterIncome ? "text-white" : "text-foreground")}>{t("common.income")}</p>
        {filterIncome ? (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : null}
      </button>
    </div>
  );
}
