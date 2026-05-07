import { format } from "date-fns";
import type { DashboardStats, ParsedItem, Transaction } from "@/features/transactions/types";

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

export function parseReceiptTextToItems(text: string): ParsedItem[] {
  // Very simple heuristic: split lines and pick last number as amount
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedItem[] = [];
  for (const line of lines) {
    // Match numbers like 1,234.56 or 1234,56 or 123456
    const m = line.match(/([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})|[0-9]+(?:[.,][0-9]{1,2})?)\s*(?:vnd|đ|d|usd|€|\$)?$/i);
    if (m) {
      const raw = m[1];
      const normalized = raw.replace(/[.,](?=\d{3})/g, "").replace(/,/g, ".");
      const amount = Number(normalized);
      const desc = line.replace(m[0], "").trim() || "Item";
      items.push({
        id: Math.random().toString(36).slice(2, 9),
        description: desc,
        amount: Number.isFinite(amount) ? amount : null,
        type: "expense",
        categoryId: null,
      });
    }
  }
  return items;
}
