"use client";

import { useCallback, useState } from "react";
import { Check, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import type { TransactionInput } from "@/features/transactions/types";

interface TransactionConfirmDrawerProps {
  isOpen: boolean;
  transaction: TransactionInput | null;
  isLoading?: boolean;
  onConfirm: (updatedTransaction: TransactionInput) => void;
  onCancel: () => void;
}

export function TransactionConfirmDrawer({
  isOpen,
  transaction,
  isLoading = false,
  onConfirm,
  onCancel,
}: TransactionConfirmDrawerProps) {
  const { t, localeCode, currency } = useI18n();
  const [editedTransaction, setEditedTransaction] = useState<TransactionInput | null>(transaction);

  // Update state when transaction prop changes
  if (transaction && transaction !== editedTransaction) {
    setEditedTransaction(transaction);
  }

  const handleConfirm = useCallback(() => {
    if (!editedTransaction) return;
    onConfirm(editedTransaction);
  }, [editedTransaction, onConfirm]);

  if (!editedTransaction) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("transactions.reviewStep") || "Xác nhận giao dịch"}</DrawerTitle>
          <DrawerDescription>
            {t("transactions.detailTitle") || "Chi tiết giao dịch"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 py-6 overflow-y-auto max-h-[60vh]">
          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("transactions.description") || "Mô tả"}:
            </label>
            <input
              type="text"
              value={editedTransaction.description}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              placeholder="Nhập mô tả..."
            />
          </div>

          {/* Type Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("transactions.type") || "Loại"}:
            </label>
            <select
              value={editedTransaction.type}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  type: e.target.value as "income" | "expense",
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
            >
              <option value="expense">
                {t("transactions.expense") || "Chi tiêu"}
              </option>
              <option value="income">
                {t("transactions.income") || "Thu nhập"}
              </option>
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("transactions.amount") || "Số tiền"}:
            </label>
            <input
              type="number"
              value={editedTransaction.amount}
              onChange={(e) =>
                setEditedTransaction({
                  ...editedTransaction,
                  amount: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              placeholder="Nhập số tiền..."
            />
            <p className="text-xs text-muted-foreground">
              {editedTransaction.type === "income" ? "+" : "-"}
              {formatCurrency(editedTransaction.amount, currency, localeCode)}
            </p>
          </div>

          {/* Category Input */}
          {editedTransaction.categoryId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("common.category") || "Danh mục"}:
              </label>
              <input
                type="text"
                value={editedTransaction.categoryId}
                onChange={(e) =>
                  setEditedTransaction({
                    ...editedTransaction,
                    categoryId: e.target.value,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                placeholder="Nhập danh mục..."
              />
            </div>
          )}
        </div>

        <DrawerFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-2" />
            {t("common.cancel") || "Hủy"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="w-4 h-4 mr-2" />
            {t("common.confirm") || "Xác nhận"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default TransactionConfirmDrawer;
