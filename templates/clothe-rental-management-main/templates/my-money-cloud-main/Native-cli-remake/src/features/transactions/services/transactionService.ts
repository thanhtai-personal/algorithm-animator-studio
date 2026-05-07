import type { Transaction, TransactionInput, TransactionUpdate } from "@/features/transactions/types";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";

type TransactionResponse = Omit<Transaction, "date" | "createdAt"> & {
  date: string;
  createdAt: string;
};

function mapTransaction(item: TransactionResponse): Transaction {
  return {
    ...item,
    date: new Date(item.date),
    createdAt: new Date(item.createdAt),
  };
}

interface ListTransactionsParams {
  start: Date;
  end: Date;
}

interface ListTransactionsPageParams {
  start: Date;
  end: Date;
  limit: number;
  offset: number;
  categoryId?: string;
}

interface CreateTransactionParams {
  input: TransactionInput;
}

interface UpdateTransactionParams {
  id: string;
  updates: TransactionUpdate;
}

interface DeleteTransactionParams {
  id: string;
}

export const transactionService = {
  async listByMonth({ start, end }: ListTransactionsParams): Promise<Transaction[]> {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const authHeaders = await getSupabaseAuthHeaders();
    const response = await apiFetch(`/api/transactions?${params.toString()}`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new Error("Failed to load transactions");
    }

    const data = (await response.json()) as TransactionResponse[];
    return data.map(mapTransaction);
  },
  async listByRange({ start, end }: ListTransactionsParams): Promise<Transaction[]> {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    const authHeaders = await getSupabaseAuthHeaders();
    const response = await apiFetch(`/api/transactions?${params.toString()}`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new Error("Failed to load transactions");
    }

    const data = (await response.json()) as TransactionResponse[];
    return data.map(mapTransaction);
  },
  async listPage({
    start,
    end,
    limit,
    offset,
    categoryId,
  }: ListTransactionsPageParams): Promise<Transaction[]> {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      limit: String(limit),
      offset: String(offset),
    });

    if (categoryId) {
      params.set("categoryId", categoryId);
    }

    const authHeaders = await getSupabaseAuthHeaders();
    const response = await apiFetch(`/api/transactions?${params.toString()}`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new Error("Failed to load transactions");
    }

    const data = (await response.json()) as TransactionResponse[];
    return data.map(mapTransaction);
  },
  async create({ input }: CreateTransactionParams): Promise<Transaction> {
    const authHeaders = await getSupabaseAuthHeaders();
    const payload = {
      ...input,
      date: input.date instanceof Date ? input.date.toISOString() : input.date,
    };
    const response = await apiFetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create transaction");
    }

    const data = (await response.json()) as TransactionResponse;
    return mapTransaction(data);
  },
  async update({ id, updates }: UpdateTransactionParams): Promise<Transaction> {
    const authHeaders = await getSupabaseAuthHeaders();
    const payload = {
      ...updates,
      date: updates.date instanceof Date ? updates.date.toISOString() : updates.date,
    };
    const response = await apiFetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to update transaction");
    }

    const data = (await response.json()) as TransactionResponse;
    return mapTransaction(data);
  },
  async remove({ id }: DeleteTransactionParams): Promise<void> {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await apiFetch(`/api/transactions/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new Error("Failed to delete transaction");
    }
  },
};
