"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/features/transactions/services/transactionService";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { transactionStore } from "@/store/transactionStore";
import type { TransactionUpdate } from "@/features/transactions/types";

interface UseUpdateTransactionMutationParams {
  userId?: string;
  isLocal?: boolean;
}

interface UpdatePayload {
  id: string;
  updates: TransactionUpdate;
}

export function useUpdateTransactionMutation(
  { userId }: UseUpdateTransactionMutationParams = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdatePayload) => {
      if (!userId) {
        throw new Error("Missing user");
      }
      // Luôn gọi API để cập nhật transaction
      const updated = await transactionService.update({ id, updates });
      // Cập nhật lại transaction vào store
      transactionStore.upsert(updated);
      return updated;
    },
    onSuccess: (data) => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.feeds() });
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.ranges() });
    },
  });
}
