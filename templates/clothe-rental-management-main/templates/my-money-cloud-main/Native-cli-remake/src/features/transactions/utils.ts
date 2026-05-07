import { format } from "date-fns";
import type { DashboardStats, Transaction } from "@/features/transactions/types";

export function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function calculateDashboardStats(transactions: Transaction[]): DashboardStats {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length,
  };
}
