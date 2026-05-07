export const TransactionTypeEnum = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;

export type TransactionType = (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];

export type Category = string;

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  createdAt: Date;
}

export interface DashboardStats {
  balance: number;
  income: number;
  expense: number;
}
