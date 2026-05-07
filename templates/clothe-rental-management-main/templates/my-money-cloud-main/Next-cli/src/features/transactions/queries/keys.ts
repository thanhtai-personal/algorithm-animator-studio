export const transactionQueryKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionQueryKeys.all, "list"] as const,
  list: (filters: { userId: string; monthKey: string }) =>
    [...transactionQueryKeys.lists(), filters] as const,
  ranges: () => [...transactionQueryKeys.all, "range"] as const,
  range: (filters: { userId: string; start: string; end: string }) =>
    [...transactionQueryKeys.ranges(), filters] as const,
  feeds: () => [...transactionQueryKeys.all, "feed"] as const,
  feed: (filters: { userId: string; monthKey: string; categoryId?: string | null; limit: number }) =>
    [...transactionQueryKeys.feeds(), filters] as const,
  details: () => [...transactionQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionQueryKeys.details(), id] as const,
};
