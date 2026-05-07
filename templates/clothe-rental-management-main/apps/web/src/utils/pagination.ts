export interface ClientPaginationResult<T> {
  page: number;
  totalPages: number;
  pageSize: number;
  items: T[];
}

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): ClientPaginationResult<T> {
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.max(1, Math.min(Math.trunc(page), totalPages));
  const start = (safePage - 1) * safePageSize;

  return {
    page: safePage,
    totalPages,
    pageSize: safePageSize,
    items: items.slice(start, start + safePageSize),
  };
}
