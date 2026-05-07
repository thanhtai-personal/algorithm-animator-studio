"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { Transaction, TransactionUpdate } from "@/features/transactions/types";

export function useStatsTransactionActions() {
  const { t } = useI18n();
  const { createOrUpdateTransaction, deleteTransaction } = useTransactions();

  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const handleSave = async (id: string, updates: TransactionUpdate) => {
    try {
      const updated = await createOrUpdateTransaction({ id, ...updates } as any);
      if (!updated) {
        toast.error(t("toast.updateFailed"));
        return false;
      }
      toast.success(t("toast.transactionUpdated"));
      return true;
    } catch {
      toast.error(t("toast.updateFailed"));
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const ok = await deleteTransaction(deleteTarget.id);
      if (!ok) {
        throw new Error("delete_failed");
      }
      toast.success(t("toast.transactionDeleted"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  };

  return {
    editTarget,
    deleteTarget,
    setEditTarget,
    setDeleteTarget,
    handleSave,
    handleDelete,
  };
}
