import { NextRequest, NextResponse } from "next/server";
import { subMonths } from "date-fns";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import { getMonthRange } from "@/lib/date";
import { calculateDashboardStats } from "@/features/transactions/utils";
import { fetchTransactionsForRange } from "@/server/data-access/stats";

export async function handleSummary(request: NextRequest) {
  try {
    const { user, supabase } = await getSupabaseClientAndUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentRange = getMonthRange(now);
    const previousRange = getMonthRange(subMonths(now, 1));

    const [currentTransactions, previousTransactions] = await Promise.all([
      fetchTransactionsForRange({
        userId: user.id,
        supabase,
        start: currentRange.start,
        end: currentRange.end,
      }),
      fetchTransactionsForRange({
        userId: user.id,
        supabase,
        start: previousRange.start,
        end: previousRange.end,
      }),
    ]);

    const currentStats = calculateDashboardStats(currentTransactions);
    const previousStats = calculateDashboardStats(previousTransactions);

    return NextResponse.json({ current: currentStats, previous: previousStats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
