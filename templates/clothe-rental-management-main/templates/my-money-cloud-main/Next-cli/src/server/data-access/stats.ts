import type { SupabaseClient } from "@supabase/supabase-js";
import { transactionAdapter } from "@/features/transactions/adapters/transactionAdapter";
import type { Transaction } from "@/features/transactions/types";

export async function fetchTransactionsForRange(params: {
  userId: string;
  supabase: SupabaseClient;
  start: Date;
  end: Date;
}): Promise<Transaction[]> {
  const { userId, supabase, start, end } = params;
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start.toISOString())
    .lte("date", end.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => transactionAdapter.toDTO(row)) as Transaction[];
}
