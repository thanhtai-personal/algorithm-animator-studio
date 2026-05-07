import type {
  Transaction,
  TransactionInput,
  TransactionRow,
  TransactionInsert,
  TransactionUpdate,
  TransactionUpdatePayload,
} from "@/features/transactions/types";

export const transactionAdapter = {
  toDTO: (row: TransactionRow): Transaction => ({
    id: row.id,
    amount: row.amount,
    description: row.description ?? "",
    categoryId: row.category_id,
    type: row.type,
    date: new Date(row.date),
    createdAt: new Date(row.created_at),
  }),
  toCreatePayload: (input: TransactionInput, userId: string | null, anonKey: string | null): TransactionInsert => ({
    id: input.id,
    user_id: userId,
    anon_key: anonKey ?? undefined,
    amount: input.amount,
    description: input.description,
    category_id: input.categoryId,
    type: input.type,
    date: input.date.toISOString(),
  }),
  toUpdatePayload: (updates: TransactionUpdate): TransactionUpdatePayload => {
    const payload: TransactionUpdatePayload = {};

    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.date !== undefined) payload.date = updates.date.toISOString();

    return payload;
  },
};
