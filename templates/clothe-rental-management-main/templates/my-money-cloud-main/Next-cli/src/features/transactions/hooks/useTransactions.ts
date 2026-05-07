"use client";

import { useCallback } from "react";
import { transactionStore } from "@/store/transactionStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { useCreateTransactionMutation } from "@/features/transactions/queries/useCreateTransactionMutation";
import { useDeleteTransactionMutation } from "@/features/transactions/queries/useDeleteTransactionMutation";
import type { TransactionInput } from "@/features/transactions/types";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useUpdateTransactionMutation } from "../queries/useUpdateTransactionMutation";
import { authStore } from "@/store/authStore";

export function useTransactions() {
  const user = authStore.userSettings;
  const userId = user?.user_id || authStore.userId || null;
  const anonId = authStore.anonId || null;
  const { isOnline } = useOnlineChecker();
  const { isAnonymous } = useAnonymousChecker();

  const createMutation = useCreateTransactionMutation({ userId: userId ?? undefined });
  const updateMutation = useUpdateTransactionMutation({ userId: userId ?? undefined });
  const deleteMutation = useDeleteTransactionMutation({ userId: userId ?? undefined });


  const createOrUpdateTransaction = useCallback(
    async (transaction: TransactionInput) => {
      if (!userId && !anonId) return false;
      const existing = transaction.id ? transactionStore.findById(transaction.id) : undefined;
      const resolvedDate = transaction.date instanceof Date
        ? transaction.date
        : transaction.date
          ? new Date(transaction.date as unknown as string)
          : existing?.date ?? new Date();
      const tx = {
        id: transaction.id || existing?.id || Date.now().toString(),
        amount: transaction.amount ?? existing?.amount ?? 0,
        description: transaction.description ?? existing?.description ?? "",
        categoryId: transaction.categoryId ?? existing?.categoryId ?? "",
        type: transaction.type ?? existing?.type ?? "expense",
        date: resolvedDate,
        createdAt: existing?.createdAt ?? new Date(),
      };
      
      if (isAnonymous) {
        // Anonymous: chỉ update store
        transactionStore.upsert(tx);
        return true;
      }

      if (!isOnline) {
        transactionStore.upsert(tx);
        const pendingPayload = {
          id: tx.id,
          amount: tx.amount,
          description: tx.description,
          categoryId: tx.categoryId,
          type: tx.type,
          date: (tx.date instanceof Date ? tx.date.toISOString() : tx.date),
        };

        offlineQueueStore.enqueue({
          id: `offline-tx-create-${tx.id}`,
          entity: "transaction",
          action: "create",
          payload: pendingPayload,
        }, userId ?? undefined);
        return true;
      }

      try {
        await (
          transaction.id
            ? updateMutation.mutateAsync({ id: transaction.id, updates: transaction })
            : createMutation.mutateAsync(transaction)
        );
        return true;
      } catch {
        return false;
      }
    },
    [anonId, createMutation, isAnonymous, isOnline, updateMutation, userId]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!userId && !anonId) return false;
      if (isAnonymous) {
        transactionStore.remove(id);
        return true;
      }
      if (!isOnline) {
        transactionStore.remove(id);
        offlineQueueStore.enqueue({
          id: `offline-tx-delete-${id}`,
          entity: "transaction",
          action: "delete",
          payload: { id },
        }, userId ?? undefined);
        return true;
      }
      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [anonId, deleteMutation, isAnonymous, isOnline, userId]
  );


  return {
    createOrUpdateTransaction,
    deleteTransaction,
  };
}
