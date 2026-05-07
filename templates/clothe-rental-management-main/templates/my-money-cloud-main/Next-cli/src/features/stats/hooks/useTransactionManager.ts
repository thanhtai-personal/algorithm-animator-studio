import { useState } from "react";
import { endOfDay, format, isAfter, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { Transaction, TransactionUpdate } from "@/features/transactions/types";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";

const PAGE_SIZE = 10;

export function useTransactionManager() {
  const { t, locale, localeCode, currency, language } = useI18n();
  const { categories, categoryMap } = categoryStore;
  const { transactions: allTransactions } = transactionStore;
  const { createOrUpdateTransaction, deleteTransaction } = useTransactions();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterIncome, setFilterIncome] = useState(true);
  const [filterExpense, setFilterExpense] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [detailTarget, setDetailTarget] = useState<Transaction | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const byCategory =
    selectedCategory === "all" ? allTransactions : allTransactions.filter((tx: any) => tx.categoryId === selectedCategory);

  const byType = byCategory.filter((tx: any) => {
    if (filterIncome && filterExpense) return true;
    if (filterIncome) return tx.type === "income";
    if (filterExpense) return tx.type === "expense";
    return true;
  });

  const filtered = (() => {
    if (!dateRange?.from) return byType;

    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return byType.filter((tx: any) => {
      if (isBefore(tx.date, start)) return false;
      if (isAfter(tx.date, end)) return false;
      return true;
    });
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered
    .slice()
    .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (id: string, updates: TransactionUpdate) => {
    try {
      const updated = await createOrUpdateTransaction({ id, ...updates } as any);
      if (!updated) {
        toast.error(t("toast.updateFailed"));
        return false;
      }
      toast.success(t("toast.transactionUpdated"));
      return true;
    } catch {
      toast.error(t("toast.updateFailed"));
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const ok = await deleteTransaction(deleteTarget.id);
      if (!ok) {
        throw new Error("delete_failed");
      }
      toast.success(t("toast.transactionDeleted"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleAdd = async (input: Parameters<typeof createOrUpdateTransaction>[0]) => {
    const ok = await createOrUpdateTransaction(input);
    if (!ok) {
      toast.error(t("toast.saveFailed"));
      return false;
    }
    toast.success(input.type === "income" ? t("toast.addedIncome") : t("toast.addedExpense"));
    return true;
  };

  const detailTitle = t("transactions.detailTitle") || t("transactions.editTitle");
  const dateFormat = language === "vi" ? "dd/MM/yyyy" : "MMM dd, yyyy";
  const formatRangeValue = (range: DateRange) => {
    if (!range.from) return "";
    if (!range.to) return format(range.from, dateFormat, { locale });
    return `${format(range.from, dateFormat, { locale })} - ${format(range.to, dateFormat, { locale })}`;
  };

  const toggleIncome = () => {
    setFilterIncome((prev) => {
      if (!prev && !filterExpense) return true;
      return !prev;
    });
    setPage(1);
  };

  const toggleExpense = () => {
    setFilterExpense((prev) => {
      if (!prev && !filterIncome) return true;
      return !prev;
    });
    setPage(1);
  };

  return {
    t,
    locale,
    localeCode,
    currency,
    categories,
    categoryMap,
    state: {
      selectedCategory,
      filterIncome,
      filterExpense,
      dateRange,
      page,
      editTarget,
      deleteTarget,
      detailTarget,
      addOpen,
      totalPages,
      pageItems,
      loading: false,
      filteredCount: filtered.length,
      detailTitle,
    },
    actions: {
      setSelectedCategory: (value: string) => {
        setSelectedCategory(value);
        setPage(1);
      },
      toggleIncome,
      toggleExpense,
      setDateRange,
      clearDateRange: () => setDateRange(undefined),
      setPage,
      setEditTarget,
      setDeleteTarget,
      setDetailTarget,
      setAddOpen,
      handleSave,
      handleDelete,
      handleAdd,
      formatRangeValue,
      formatAmount: (amount: number) => formatCurrency(amount, currency, localeCode),
      formatDateTime: (date: Date) => format(date, "dd/MM/yyyy HH:mm:ss", { locale }),
    },
  };
}
