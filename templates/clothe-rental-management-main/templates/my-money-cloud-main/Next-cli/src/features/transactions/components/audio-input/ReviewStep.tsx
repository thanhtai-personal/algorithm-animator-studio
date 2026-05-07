"use client";

import { CategoryIcon } from "@/components/icons/CategoryIcon";
import type { CategoryRow } from "@/features/categories/types";
import { cn } from "@/utils";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

type ReviewStepProps = {
  transactionType: "income" | "expense";
  amount: number;
  selectedCategory?: CategoryRow;
  notes: string;
};

export function ReviewStep({ transactionType, amount, selectedCategory, notes }: ReviewStepProps) {
  const { t, currency, localeCode } = useI18n();
  const formattedAmount = amount ? formatCurrency(amount, currency, localeCode) : "";

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("common.type")}</span>
          <span
            className={cn("text-sm font-semibold", transactionType === "expense" ? "text-red-600" : "text-green-600")}
          >
            {t(transactionType === "expense" ? "common.expense" : "common.income")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("common.amount")}</span>
          <span className="text-lg font-bold">{formattedAmount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("common.category")}</span>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <>
                <CategoryIcon icon={selectedCategory.icon || ""} color={selectedCategory.color || ""} size="sm" />
                <span className="text-sm font-medium">{selectedCategory.name}</span>
              </>
            )}
          </div>
        </div>

        {notes && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm text-muted-foreground">{t("common.notes")}</span>
            <span className="text-sm text-right line-clamp-2">{notes}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {t("addTransaction.confirmMessage") || "Xác nhận lưu giao dịch?"}
      </p>
    </div>
  );
}
