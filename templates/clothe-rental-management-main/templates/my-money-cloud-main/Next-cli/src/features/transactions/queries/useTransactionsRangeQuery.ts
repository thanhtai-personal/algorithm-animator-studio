import { useQuery } from "@tanstack/react-query";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { transactionService } from "@/features/transactions/services/transactionService";
import { transactionStore } from "@/store/transactionStore";

interface UseTransactionsRangeQueryParams {
  userId?: string;
  start: Date;
  end: Date;
  enabled?: boolean;
  isLocal?: boolean;
}

export function useTransactionsRangeQuery({
  userId,
  start,
  end,
  enabled = true,
  isLocal = false,
}: UseTransactionsRangeQueryParams) {
  const query = useQuery({
    queryKey:
      userId
        ? transactionQueryKeys.range({
          userId,
          start: start.toISOString(),
          end: end.toISOString(),
        })
        : transactionQueryKeys.ranges(),
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
      return transactionService.listByRange({ start, end });
    },
    enabled: Boolean(enabled && userId),
  });

  return query;
}
