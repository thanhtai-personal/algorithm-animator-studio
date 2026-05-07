"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/features/transactions/services/transactionService";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { transactionStore } from "@/store/transactionStore";
import type { TransactionInput } from "@/features/transactions/types";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface UseCreateTransactionMutationParams {
  userId?: string;
}

export function useCreateTransactionMutation({
  userId,
}: UseCreateTransactionMutationParams) {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (input: TransactionInput) => transactionService.create({ input }),
    onSuccess: (data) => {
      if (userId) {
        transactionStore.upsert(data);
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.feeds() });
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.ranges() });
      }
      toast.success(t("transactions.createSuccess"));
    },
    onError: () => {
      toast.error(t("transactions.createFailed"));
    }
  });
}
