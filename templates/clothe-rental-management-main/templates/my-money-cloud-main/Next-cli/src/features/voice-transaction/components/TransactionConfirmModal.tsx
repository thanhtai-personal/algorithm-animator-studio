"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { TransactionInput } from "@/features/transactions/types";

interface TransactionConfirmModalProps {
  isOpen: boolean;
  transaction: TransactionInput | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransactionConfirmModal({
  isOpen,
  transaction,
  isLoading = false,
  onConfirm,
  onCancel,
}: TransactionConfirmModalProps) {
  const { t, localeCode, currency } = useI18n();

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("common.confirm") || "Xác nhận"}</DialogTitle>
          <DialogDescription>
            {t("transactions.detailTitle") || "Chi tiết giao dịch"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
              <span className="text-sm text-muted-foreground">
                {t("transactions.description") || "Mô tả"}:
              </span>
              <span className="font-medium text-sm">{transaction.description}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
              <span className="text-sm text-muted-foreground">
                {t("transactions.type") || "Loại"}:
              </span>
              <span className="font-medium text-sm">
                {transaction.type === "income"
                  ? t("transactions.income") || "Thu nhập"
                  : t("transactions.expense") || "Chi tiêu"}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
              <span className="text-sm text-muted-foreground">
                {t("transactions.amount") || "Số tiền"}:
              </span>
              <span
                className={`font-bold text-sm ${
                  transaction.type === "income"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount, currency, localeCode)}
              </span>
            </div>

            {transaction.categoryId && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
                <span className="text-sm text-muted-foreground">
                  {t("common.category") || "Danh mục"}:
                </span>
                <span className="font-medium text-sm">{transaction.categoryId}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            {t("common.cancel") || "Hủy"}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="w-4 h-4 mr-2" />
            {t("common.confirm") || "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionConfirmModal;
