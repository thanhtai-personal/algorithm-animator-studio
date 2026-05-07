"use client";

import { Transaction, categoryIcons } from "../types/transaction";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionCard({
  transaction,
  index,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const { currency, localeCode } = useI18n();
  const isIncome = transaction.type === "income";

  return (
    <div
      className={cn(
        "p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-4",
        isIncome ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
              isIncome ? "bg-green-200/50 dark:bg-green-900" : "bg-red-200/50 dark:bg-red-900"
            )}
          >
            {categoryIcons.hasOwnProperty(transaction.category)
              ? categoryIcons[transaction.category as keyof typeof categoryIcons]
              : categoryIcons['other_expense']}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">
              {transaction.category}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {transaction.note}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {transaction.createdAt.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "font-bold text-lg whitespace-nowrap",
              isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount, currency, localeCode)}
          </p>
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(transaction)}
                  className="text-xs px-2 py-1 rounded bg-foreground/10 hover:bg-foreground/20 transition-colors"
                >
                  Sửa
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="text-xs px-2 py-1 rounded bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
                >
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
