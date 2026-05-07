import { NextRequest, NextResponse } from "next/server";
import { getAnonKeyForUser } from "@/lib/supabase/anonKey";
import type { TransactionInput, TransactionUpdate } from "@/features/transactions/types";
import { transactionAdapter } from "@/features/transactions/adapters/transactionAdapter";
import { getRequestContext } from "@/server/data-access/supabaseClients";
import {
  deleteTransactionForAnonKey,
  deleteTransactionForAnonymousUser,
  deleteTransactionForUser,
  insertTransactionForAnonKey,
  insertTransactionForAnonymousUser,
  insertTransactionForUser,
  listTransactionsForAnonKey,
  listTransactionsForAnonymousUser,
  listTransactionsForUser,
  updateTransactionForAnonKey,
  updateTransactionForAnonymousUser,
  updateTransactionForUser,
  type TransactionListFilters,
} from "@/server/data-access/transactions";
import { createServiceRoleClient, readAnonKey } from "@/server/utils/anonKey";
import { parseTransactionFilters } from "@/server/utils/transactionFilters";

export async function handleListTransactions(request: NextRequest) {
  try {
    const filters = parseTransactionFilters(request);
    if ("error" in filters) {
      return NextResponse.json({ error: filters.error }, { status: 400 });
    }

    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data, error } = await listTransactionsForAnonKey(admin, anonKey, filters);
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json(data.map((row) => transactionAdapter.toDTO(row)));
    }

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await listTransactionsForUser(supabase, user.id, filters);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data.map((row) => transactionAdapter.toDTO(row)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleCreateTransaction(request: NextRequest) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Omit<TransactionInput, "date"> & { date: string };
    const input: TransactionInput = { ...body, date: new Date(body.date) };

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data, error } = await insertTransactionForAnonKey(admin, anonKey, input);
      if (error || !data) return NextResponse.json({ error: error ?? "Insert failed" }, { status: 500 });
      return NextResponse.json(transactionAdapter.toDTO(data));
    }

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { data, error } = await insertTransactionForUser(supabase, user.id, input);
    if (error || !data) return NextResponse.json({ error: error ?? "Insert failed" }, { status: 500 });
    return NextResponse.json(transactionAdapter.toDTO(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleUpdateTransaction(request: NextRequest, id: string) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = (await request.json()) as TransactionUpdate & { date?: string };
    const normalizedUpdates: TransactionUpdate = {
      ...updates,
      date: updates.date ? new Date(updates.date) : undefined,
    };

    if (anonKey) {
      const admin = createServiceRoleClient();
      const { data, error } = await updateTransactionForAnonKey(admin, id, anonKey, normalizedUpdates);
      if (error || !data) return NextResponse.json({ error: error ?? "Update failed" }, { status: 500 });
      return NextResponse.json(transactionAdapter.toDTO(data));
    }

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await updateTransactionForUser(supabase, id, user.id, normalizedUpdates);
    if (error || !data) return NextResponse.json({ error: error ?? "Update failed" }, { status: 500 });
    return NextResponse.json(transactionAdapter.toDTO(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handleDeleteTransaction(request: NextRequest, id: string) {
  try {
    const { supabase, user } = await getRequestContext(request);
    const anonKey = !user ? readAnonKey(request) : null;

    if (!user && !anonKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (anonKey) {
      const admin = createServiceRoleClient();
      const error = await deleteTransactionForAnonKey(admin, id, anonKey);
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const error = await deleteTransactionForUser(supabase, id, user.id);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
