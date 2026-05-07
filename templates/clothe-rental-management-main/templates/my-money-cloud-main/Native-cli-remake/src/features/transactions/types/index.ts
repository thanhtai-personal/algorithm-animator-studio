export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  type: TransactionType;
  date: Date;
  createdAt: Date;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export type TransactionInput = Omit<Transaction, "id" | "createdAt"> & { id?: string; user_id?: string | null };
export type TransactionUpdate = Partial<Omit<Transaction, "id" | "createdAt">>;

export interface TransactionRow {
  id: string;
  user_id: string | null;
  amount: number;
  description: string | null;
  category_id: string;
  type: TransactionType;
  date: string;
  created_at: string;
  anon_key?: string | null;
}

export interface TransactionInsert {
  id?: string;
  user_id: string | null;
  anon_key?: string | null;
  amount: number;
  description: string | null;
  category_id: string;
  type: TransactionType;
  date: string;
}

export type TransactionUpdatePayload = Partial<Omit<TransactionInsert, "user_id">>;
