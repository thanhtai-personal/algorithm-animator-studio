
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/features/transactions/services/transactionService";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { transactionStore } from "@/store/transactionStore";

interface UseDeleteTransactionMutationParams {
  userId?: string;
}

export function useDeleteTransactionMutation(
  { userId }: UseDeleteTransactionMutationParams = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) {
        throw new Error("Missing user");
      }
      await transactionService.remove({ id });
      return id;
    },
    onSuccess: (id) => {
      transactionStore.remove(id);
      if (userId) {
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list({ userId, monthKey: "full" }) });
      }
    },
  });
}
