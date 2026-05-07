"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/utils";
import type { Transaction } from "@/features/transactions/types";
import type { CategoryRow } from "@/features/categories/types";
import { observer } from "mobx-react-lite";
import { categoryStore } from "@/store/categoryStore";

type TransactionDetailDialogProps = {
  open: boolean;
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
  detailTitle: string;
  t: (key: string) => string;
  formatAmount: (amount: number) => string;
  formatDateTime: (date: Date) => string;
};

export const TransactionDetailDialog = observer(function TransactionDetailDialog({
  open,
  transaction,
  onOpenChange,
  detailTitle,
  t,
  formatAmount,
  formatDateTime,
}: TransactionDetailDialogProps) {
  const { categoryMap } = categoryStore;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {transaction ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{detailTitle}</DialogTitle>
              <DialogDescription>{formatDateTime(transaction.date)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.amount")}</span>
                <span className={cn("font-semibold", transaction.type === "income" ? "text-emerald-500" : "text-rose-500")}>
                  {formatAmount(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.type")}</span>
                <span className="font-semibold">{transaction.type === "income" ? t("common.income") : t("common.expense")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("common.category")}</span>
                <span className="font-semibold truncate max-w-[55%] text-right">
                  {categoryMap[transaction.categoryId]?.name ?? t("categories.other")}
                </span>
              </div>
              {transaction.description ? (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs mb-1">{t("common.descriptionOptional")}</p>
                  <p className="text-sm whitespace-pre-line">{transaction.description}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
})
