import { useState } from "react";

import { getMonthRange } from "@/lib/date";
import { calculateDashboardStats } from "@/features/transactions/utils";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { uiStore } from "@/store/uiStore";
import type { DashboardStats } from "@/features/transactions/types";
import { useI18n } from "@/lib/i18n";
import { buildCategoryStats } from "../utils";

const EMPTY_STATS: DashboardStats = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  transactionCount: 0,
};

export const useHomeStat = () => {
  const { t } = useI18n();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const { start, end } = getMonthRange(selectedMonth);
  const monthTransactions = transactionStore.transactions.filter(
    (transaction) => transaction.date >= start && transaction.date <= end
  );
  const allStats = calculateDashboardStats(monthTransactions) ?? EMPTY_STATS;
  const categoryStats = buildCategoryStats({
    categories: categoryStore.categories,
    categoryMap: categoryStore.categoryMap,
    transactions: monthTransactions,
    totalExpense: allStats.totalExpense,
    fallbackName: t("categories.other"),
  });

  return {
    categoryStats,
    monthTransactions,
    selectedMonth,
    loading: uiStore.loading,
    allStats,
    balanceLoading: uiStore.loading,
    setSelectedMonth,
  };
};
