
import { useQuery } from "@tanstack/react-query";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { transactionService } from "@/features/transactions/services/transactionService";
import { getMonthRange } from "@/lib/date";
import { getMonthKey } from "@/features/transactions/utils";
import { transactionStore } from "@/store/transactionStore";

interface UseTransactionsQueryParams {
  userId?: string;
  month: Date;
  enabled?: boolean;
  isLocal?: boolean;
}

export function useTransactionsQuery({
  userId,
  month,
  enabled = true,
  isLocal = false,
}: UseTransactionsQueryParams) {
  const monthKey = getMonthKey(month);
  const { start, end } = getMonthRange(month);

  const query = useQuery({
    queryKey: userId
      ? transactionQueryKeys.list({ userId, monthKey })
      : transactionQueryKeys.lists(),
    queryFn: () => {
      if (!userId) {
        throw new Error("Missing user");
      }
      if (isLocal) {
        // Lấy từ store, không đọc storage
        return transactionStore.transactions.filter(
          (item) =>
            item.date >= start &&
            item.date <= end
        );
      }
      // Lấy từ API
      return transactionService.listByMonth({ start, end });
    },
    enabled: Boolean(enabled && userId),
  });

  return query;
}
