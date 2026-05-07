import { useMemo } from "react";
import { eachDayOfInterval, format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { getMonthRange } from "@/lib/date";
import type { CategoryRow } from "@/features/categories/types";
import type { Transaction } from "@/features/transactions/types";
import type {
  CategoryStat,
  DailyTrendItem,
  HighlightCategory,
  HighlightTransaction,
} from "@/features/stats/types";
import { categoryStore } from "@/store/categoryStore";

interface UseStatsParams {
  transactions: Transaction[];
  categoryStats: CategoryStat[];
  categoryMap?: Map<string, CategoryRow>;
  selectedMonth: Date;
  totalIncome: number;
  totalExpense: number;
}

interface StatsHighlights {
  averageDailyIncome: number;
  averageDailyExpense: number;
  topCategory?: HighlightCategory;
  topExpense?: HighlightTransaction;
}

interface UseStatsResult {
  dailyTrend: DailyTrendItem[];
  highlights: StatsHighlights;
  hasTrendData: boolean;
}

export function useStats({
  transactions,
  categoryStats,
  selectedMonth,
  totalIncome,
  totalExpense,
}: UseStatsParams): UseStatsResult {
  const { t } = useI18n();
  const { categoryMap: lookup } = categoryStore;

  const dayRange = useMemo(() => {
    const { start, end } = getMonthRange(selectedMonth);
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const dailyTrend = useMemo(() => {
    const totalsByDate = new Map<string, { income: number; expense: number }>();

    transactions.forEach((transaction) => {
      const key = format(transaction.date, "yyyy-MM-dd");
      const current = totalsByDate.get(key) || { income: 0, expense: 0 };
      if (transaction.type === "income") {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }
      totalsByDate.set(key, current);
    });

    return dayRange.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const totals = totalsByDate.get(key) || { income: 0, expense: 0 };
      return {
        date: day,
        label: format(day, "dd"),
        income: totals.income,
        expense: totals.expense,
      };
    });
  }, [transactions, dayRange]);

  const highlights = useMemo<StatsHighlights>(() => {
    const averageDailyIncome = dayRange.length > 0 ? totalIncome / dayRange.length : 0;
    const averageDailyExpense = dayRange.length > 0 ? totalExpense / dayRange.length : 0;

    const topCategory = categoryStats.length
      ? (() => {
          const category = categoryStats[0];
          const meta = lookup[category.categoryId];
          return {
            ...category,
            icon: meta?.icon ?? "MoreHorizontal",
            color: meta?.color ?? category.color,
          };
        })()
      : undefined;

    const topExpense = (() => {
      const expenseTransactions = transactions.filter((transaction) => transaction.type === "expense");
      if (expenseTransactions.length === 0) return undefined;

      const largest = expenseTransactions.reduce((max, transaction) =>
        transaction.amount > max.amount ? transaction : max
      );
      const meta = lookup[largest.categoryId];
      const description = largest.description?.trim() || t("stats.noDescription");

      return {
        id: largest.id,
        amount: largest.amount,
        description,
        categoryName: meta?.name ?? t("categories.other"),
        categoryIcon: meta?.icon ?? "MoreHorizontal",
        categoryColor: meta?.color ?? "category-other",
        type: largest.type,
        date: largest.date,
      };
    })();

    return {
      averageDailyIncome,
      averageDailyExpense,
      topCategory,
      topExpense,
    };
  }, [categoryStats, dayRange.length, totalIncome, totalExpense, transactions, t, lookup]);

  const hasTrendData = useMemo(
    () => dailyTrend.some((item) => item.income > 0 || item.expense > 0),
    [dailyTrend]
  );

  return {
    dailyTrend,
    highlights,
    hasTrendData,
  };
}
