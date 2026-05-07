import { NextRequest } from "next/server";
import type { TransactionListFilters } from "@/server/data-access/transactions";

export function parseTransactionFilters(request: NextRequest): TransactionListFilters | { error: string } {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return { error: "Missing date range" };
  const categoryId = searchParams.get("categoryId");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  return {
    start,
    end,
    categoryId: categoryId || null,
    limit: limitParam ? Number(limitParam) : null,
    offset: offsetParam ? Number(offsetParam) : null,
  };
}
