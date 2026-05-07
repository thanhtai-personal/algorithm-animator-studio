import type { TransactionType } from "@/features/transactions/types";

export interface DailyTrendItem {
  date: Date;
  label: string;
  income: number;
  expense: number;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface HighlightCategory extends CategoryStat {
  icon: string;
}

export interface HighlightTransaction {
  id: string;
  amount: number;
  description: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  type: TransactionType;
  date: Date;
}
