import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionInput, TransactionUpdate } from "@/features/transactions/types";
import { getCategoryIdVariants } from "@/features/categories/constants";
import { transactionAdapter } from "@/features/transactions/adapters/transactionAdapter";

export type TransactionListFilters = {
  start: string;
  end: string;
  categoryId?: string | null;
  limit?: number | null;
  offset?: number | null;
};

export async function listTransactionsForAnonKey(
  admin: SupabaseClient,
  anonKey: string,
  filters: TransactionListFilters,
) {
  let query = admin
    .from("transactions")
    .select("*")
    .gte("date", filters.start)
    .lte("date", filters.end)
    .is("user_id", null)
    .eq("anon_key", anonKey);

  if (filters.categoryId) {
    const categoryIds = getCategoryIdVariants(filters.categoryId);
    query = query.in("category_id", categoryIds);
  }

  query = query.order("date", { ascending: false }).order("created_at", { ascending: false });

  if (filters.limit && filters.limit > 0) {
    const startIndex = Math.max(0, filters.offset ?? 0);
    const endIndex = startIndex + filters.limit - 1;
    query = query.range(startIndex, endIndex);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}

export async function listTransactionsForUser(
  supabase: SupabaseClient,
  userId: string,
  filters: TransactionListFilters,
) {
  let query = supabase
    .from("transactions")
    .select("*")
    .gte("date", filters.start)
    .lte("date", filters.end)
    .eq("user_id", userId);

  if (filters.categoryId) {
    const categoryIds = getCategoryIdVariants(filters.categoryId);
    query = query.in("category_id", categoryIds);
  }

  query = query.order("date", { ascending: false }).order("created_at", { ascending: false });

  if (filters.limit && filters.limit > 0) {
    const startIndex = Math.max(0, filters.offset ?? 0);
    const endIndex = startIndex + filters.limit - 1;
    query = query.range(startIndex, endIndex);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}

export async function listTransactionsForAnonymousUser(
  supabase: SupabaseClient,
  anonKey: string,
  filters: TransactionListFilters,
) {
  let query = supabase
    .from("transactions")
    .select("*")
    .gte("date", filters.start)
    .lte("date", filters.end)
    .is("user_id", null)
    .eq("anon_key", anonKey);

  if (filters.categoryId) {
    const categoryIds = getCategoryIdVariants(filters.categoryId);
    query = query.in("category_id", categoryIds);
  }

  query = query.order("date", { ascending: false }).order("created_at", { ascending: false });

  if (filters.limit && filters.limit > 0) {
    const startIndex = Math.max(0, filters.offset ?? 0);
    const endIndex = startIndex + filters.limit - 1;
    query = query.range(startIndex, endIndex);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}

export async function insertTransactionForAnonKey(
  admin: SupabaseClient,
  anonKey: string,
  input: TransactionInput,
) {
  const payload = transactionAdapter.toCreatePayload(input, null, anonKey);
  const { data, error } = await admin.from("transactions").insert(payload).select("*").single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function insertTransactionForAnonymousUser(
  supabase: SupabaseClient,
  anonKey: string,
  input: TransactionInput,
) {
  const payload = transactionAdapter.toCreatePayload(input, null, anonKey);
  const { data, error } = await supabase.from("transactions").insert(payload).select("*").single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function insertTransactionForUser(
  supabase: SupabaseClient,
  userId: string,
  input: TransactionInput,
) {
  const payload = transactionAdapter.toCreatePayload(input, userId, null);
  const { data, error } = await supabase
    .from("transactions")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateTransactionForAnonKey(
  admin: SupabaseClient,
  id: string,
  anonKey: string,
  updates: TransactionUpdate,
) {
  const payload = transactionAdapter.toUpdatePayload(updates);
  const { data, error } = await admin
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .is("user_id", null)
    .eq("anon_key", anonKey)
    .select("*")
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateTransactionForAnonymousUser(
  supabase: SupabaseClient,
  id: string,
  anonKey: string,
  updates: TransactionUpdate,
) {
  const payload = transactionAdapter.toUpdatePayload(updates);
  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .is("user_id", null)
    .eq("anon_key", anonKey)
    .select("*")
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateTransactionForUser(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  updates: TransactionUpdate,
) {
  const payload = transactionAdapter.toUpdatePayload(updates);
  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function deleteTransactionForAnonKey(admin: SupabaseClient, id: string, anonKey: string) {
  const { error } = await admin.from("transactions").delete().eq("id", id).is("user_id", null).eq("anon_key", anonKey);
  return error?.message ?? null;
}

export async function deleteTransactionForAnonymousUser(
  supabase: SupabaseClient,
  id: string,
  anonKey: string,
) {
  const { error } = await supabase.from("transactions").delete().eq("id", id).is("user_id", null).eq("anon_key", anonKey);
  return error?.message ?? null;
}

export async function deleteTransactionForUser(supabase: SupabaseClient, id: string, userId: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
  return error?.message ?? null;
}
