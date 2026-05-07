
import { useInfiniteQuery } from "@tanstack/react-query";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { transactionService } from "@/features/transactions/services/transactionService";
import { getMonthRange } from "@/lib/date";
import { getMonthKey } from "@/features/transactions/utils";
import { transactionStore } from "@/store/transactionStore";

interface UseTransactionsInfiniteQueryParams {
  userId?: string;
  month: Date;
  categoryId?: string | null;
  limit?: number;
  enabled?: boolean;
  isLocal?: boolean;
}

export function useTransactionsInfiniteQuery({
  userId,
  month,
  categoryId,
  limit = 20,
  enabled = true,
  isLocal = false,
}: UseTransactionsInfiniteQueryParams) {

  const monthKey = getMonthKey(month);
  const { start, end } = getMonthRange(month);
  const localVersion = isLocal ? transactionStore.transactions.length : 0;

  const queryKey = isLocal
    ? [...transactionQueryKeys.feeds(), "local", monthKey, categoryId ?? "all", limit, localVersion]
    : userId
      ? transactionQueryKeys.feed({
          userId,
          monthKey,
          categoryId: categoryId ?? null,
          limit,
        })
      : transactionQueryKeys.feeds();

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => {
      if (isLocal) {
        // Lấy từ store, không đọc storage
        const filtered = transactionStore.transactions.filter(
          (item) =>
            item.date >= start &&
            item.date <= end &&
            (!categoryId || item.categoryId === categoryId)
        );
        return filtered.slice(pageParam, pageParam + limit);
      }
      if (!userId) {
        throw new Error("Missing user");
      }
      // Lấy từ API
      return transactionService.listPage({
        start,
        end,
        limit,
        offset: pageParam,
        categoryId: categoryId ?? undefined,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < limit) {
        return undefined;
      }
      const nextOffset = allPages.reduce((sum, page) => sum + page.length, 0);
      return nextOffset;
    },
    enabled: Boolean(enabled && (isLocal || userId)),
  });

  return query;
}
