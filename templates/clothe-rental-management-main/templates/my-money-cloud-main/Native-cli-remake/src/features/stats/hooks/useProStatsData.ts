import { useCallback, useEffect, useMemo } from "react";
import {
  addMonths,
  differenceInCalendarMonths,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { useI18n } from "@/lib/i18n";
import { useTransactionsRangeQuery } from "@/features/transactions/queries/useTransactionsRangeQuery";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Transaction } from "@/features/transactions/types";
import { filterByRange, formatRangeValue, resolveCategoryColor } from "@/features/stats/utils";
import { CHART_COLORS, LIST_PAGE_SIZE, MAX_RANGE_MONTHS, MIN_DATE } from "@/features/stats/constants";
import { authStore } from "@/store/authStore";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { useStatsSummaryQuery } from "@/features/stats/queries/useStatsSummaryQuery";
import { statsStore } from "@/store/statsStore";
import { useToast } from "@/hooks/use-toast";

import type { CategoryChartMode, PeriodMode } from "@/store/statsStore";
export type { CategoryChartMode, PeriodMode };

const FALLBACK_DATE = new Date(0);

function normalizeDate(value: Date | string | number | null | undefined): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? FALLBACK_DATE : value;
  }
  if (value == null) {
    return FALLBACK_DATE;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? FALLBACK_DATE : date;
}

function normalizeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map((transaction) => {
    const date = normalizeDate(transaction.date as Date | string | number);
    const createdAt = normalizeDate(transaction.createdAt as Date | string | number);
    if (date === transaction.date && createdAt === transaction.createdAt) {
      return transaction;
    }
    return {
      ...transaction,
      date,
      createdAt,
    };
  });
}

export function useProStatsData() {
  const { t, locale, language, localeCode, currency } = useI18n();
  const { toast } = useToast();
  const { isAnonymous } = useAnonymousChecker();
  const userId = authStore.userId;
  const categories = categoryStore.categories;
  const categoryMap = categoryStore.categoryMap;

  const summaryRange = statsStore.summaryRange;
  const periodRange = statsStore.periodRange;
  const categoryRange = statsStore.categoryRange;
  const periodMode = statsStore.periodMode;
  const categoryChartMode = statsStore.categoryChartMode;
  const listRange = statsStore.listRange;
  const selectedCategoryIds = statsStore.selectedCategoryIds;
  const listPage = statsStore.listPage;
  const detailTx = statsStore.detailTransaction;

  const canFetchRemote = Boolean(userId && !isAnonymous && isSupabaseConfigured);
  useStatsSummaryQuery(canFetchRemote);
  const serverSummary = canFetchRemote
    ? {
        current: statsStore.current,
        previous: statsStore.previous,
        loading: statsStore.loading,
        error: statsStore.error,
        lastUpdated: statsStore.lastUpdated,
      }
    : { current: null, previous: null, loading: false, error: null, lastUpdated: null };

  const fullEnd = endOfDay(new Date());
  const rangeQuery = useTransactionsRangeQuery({
    userId: canFetchRemote ? userId ?? undefined : undefined,
    start: MIN_DATE,
    end: fullEnd,
    enabled: canFetchRemote,
  });

  useEffect(() => {
    if (!canFetchRemote || !rangeQuery.data) return;
    const existing = transactionStore.transactions;
    const byId = new Map(existing.map((item) => [item.id, item]));
    rangeQuery.data.forEach((item) => {
      byId.set(item.id, item);
    });
    transactionStore.write(Array.from(byId.values()));
  }, [canFetchRemote, rangeQuery.data]);

  const allTransactions = useMemo(
    () => normalizeTransactions(transactionStore.transactions),
    [transactionStore.transactions],
  );
  const dateFormat = language === "vi" ? "dd/MM/yyyy" : "MMM dd, yyyy";
  const dateTimeFormat = `${dateFormat} HH:mm:ss`;

  const summaryRangeValue = useMemo(() => filterByRange(allTransactions, normalizeRange(summaryRange)), [allTransactions, summaryRange]);
  const periodRangeValue = useMemo(() => filterByRange(allTransactions, normalizeRange(periodRange)), [allTransactions, periodRange]);
  const categoryRangeValue = useMemo(() => filterByRange(allTransactions, normalizeRange(categoryRange)), [allTransactions, categoryRange]);
  const listRangeValue = useMemo(() => normalizeRange(listRange), [listRange]);

  const totals = useMemo(() => {
    return summaryRangeValue.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [summaryRangeValue]);

  const localSummary = useMemo(
    () => ({
      totalIncome: totals.income,
      totalExpense: totals.expense,
      transactionCount: summaryRangeValue.length,
    }),
    [totals.income, totals.expense, summaryRangeValue.length]
  );

  const periodData = useMemo(() => {
    const grouped = new Map<string, { label: string; date: Date; income: number; expense: number }>();
    periodRangeValue.forEach((transaction) => {
      const date =
        periodMode === "month"
          ? startOfMonth(transaction.date)
          : periodMode === "year"
            ? startOfYear(transaction.date)
            : startOfDay(transaction.date);
      const key = date.toISOString();
      const label =
        periodMode === "year"
          ? format(date, "yyyy")
          : periodMode === "month"
            ? format(date, "MMM yyyy", { locale })
            : format(date, language === "vi" ? "dd/MM" : "MMM dd", { locale });
      if (!grouped.has(key)) {
        grouped.set(key, { label, date, income: 0, expense: 0 });
      }
      const bucket = grouped.get(key)!;
      if (transaction.type === "income") {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
      }
    });
    return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [periodRangeValue, language, locale, periodMode]);

  const periodChartHeight = useMemo(
    () => Math.max(240, periodData.length * 44),
    [periodData.length]
  );

  const periodMax = useMemo(
    () => periodData.reduce((max, item) => Math.max(max, item.income, item.expense), 0),
    [periodData]
  );
  const periodDomainMax = periodMax > 0 ? periodMax : 1;

  const categoryData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        income: number;
        expense: number;
      }
    >();
    categoryRangeValue.forEach((transaction) => {
      const category = categoryMap[transaction.categoryId];
      const hasValidCategory = category !== undefined;
      const label = category?.name ?? t("categories.other");
      const groupKey = hasValidCategory ? transaction.categoryId : "other";

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          categoryId: groupKey,
          categoryName: label,
          income: 0,
          expense: 0,
        });
      }
      const bucket = grouped.get(groupKey)!;
      if (transaction.type === "income") {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
      }
    });
    return Array.from(grouped.values())
      .map((item) => ({ ...item, total: item.income + item.expense }))
      .sort((a, b) => b.total - a.total);
  }, [categoryRangeValue, categoryMap, t]);

  const categoryChartData = useMemo(
    () =>
      categoryData.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        income: item.income,
        expense: -item.expense,
        incomeLabel: item.income,
        expenseLabel: item.expense,
      })),
    [categoryData]
  );

  const categoryChartHeight = useMemo(
    () => Math.max(240, categoryData.length * 44),
    [categoryData.length]
  );

  const categoryMax = useMemo(
    () =>
      categoryChartData.reduce(
        (max, item) => Math.max(max, item.incomeLabel, item.expenseLabel),
        0
      ),
    [categoryChartData]
  );
  const categoryDomainMax = categoryMax > 0 ? categoryMax : 1;

  const incomeCategoryData = useMemo(
    () =>
      categoryData
        .filter((item) => item.income > 0)
        .sort((a, b) => b.income - a.income),
    [categoryData]
  );
  const expenseCategoryData = useMemo(
    () =>
      categoryData
        .filter((item) => item.expense > 0)
        .sort((a, b) => b.expense - a.expense),
    [categoryData]
  );
  const incomePieData = useMemo(
    () =>
      incomeCategoryData.map((item) => ({
        categoryId: item.categoryId,
        name: item.categoryName,
        value: item.income,
        color: resolveCategoryColor(categoryMap[item.categoryId]?.color, CHART_COLORS.income),
      })),
    [incomeCategoryData, categoryMap]
  );
  const expensePieData = useMemo(
    () =>
      expenseCategoryData.map((item) => ({
        categoryId: item.categoryId,
        name: item.categoryName,
        value: item.expense,
        color: resolveCategoryColor(categoryMap[item.categoryId]?.color, CHART_COLORS.expense),
      })),
    [expenseCategoryData, categoryMap]
  );

  const categoryOptions = useMemo(
    () => [{ id: "all", name: t("categories.all") }, ...categories],
    [categories, t]
  );
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategoryIds.includes("all") || selectedCategoryIds.length === 0) {
      return t("categories.all");
    }
    if (selectedCategoryIds.length === 1) {
      return categoryOptions.find((opt) => opt.id === selectedCategoryIds[0])?.name ?? t("categories.all");
    }
    return `${selectedCategoryIds.length} ${t("stats.categoriesSelected") || "categories"}`;
  }, [selectedCategoryIds, categoryOptions, t]);

  const listTransactions = useMemo(() => {
    const { start, end } = listRangeValue;
    return allTransactions
      .filter((transaction) => {
        const isAllCategories = selectedCategoryIds.includes("all") || selectedCategoryIds.length === 0;
        if (!isAllCategories && !selectedCategoryIds.includes(transaction.categoryId)) {
          return false;
        }
        if (start && isBefore(transaction.date, start)) return false;
        if (end && isAfter(transaction.date, end)) return false;
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allTransactions, listRangeValue, selectedCategoryIds]);

  const listTotals = useMemo(() => {
    return listTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [listTransactions]);

  const enforceRangeLimit = useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from || !range.to) return range;
      const diffMonths = differenceInCalendarMonths(range.to, range.from);
      if (diffMonths > MAX_RANGE_MONTHS) {
        const capped = addMonths(range.from, MAX_RANGE_MONTHS);
        toast.error(t("stats.rangeLimit"));
        return { from: range.from, to: capped };
      }
      return range;
    },
    [t, toast]
  );

  const handleSummaryRangeChange = useCallback(
    (range: DateRange | undefined) => {
      statsStore.setSummaryRange(enforceRangeLimit(range));
    },
    [enforceRangeLimit]
  );

  const handlePeriodRangeChange = useCallback(
    (range: DateRange | undefined) => {
      statsStore.setPeriodRange(enforceRangeLimit(range));
    },
    [enforceRangeLimit]
  );

  const handleCategoryRangeChange = useCallback(
    (range: DateRange | undefined) => {
      statsStore.setCategoryRange(enforceRangeLimit(range));
    },
    [enforceRangeLimit]
  );

  const handleListRangeChange = useCallback(
    (range: DateRange | undefined) => {
      statsStore.setListRange(enforceRangeLimit(range));
    },
    [enforceRangeLimit]
  );

  const handlePeriodModeChange = useCallback((mode: PeriodMode) => {
    statsStore.setPeriodMode(mode);
  }, []);

  const handleCategoryChartModeChange = useCallback((mode: CategoryChartMode) => {
    statsStore.setCategoryChartMode(mode);
  }, []);

  const handleSelectedCategoryIdsChange = useCallback(
    (value: string[] | ((prev: string[]) => string[])) => {
      const next = typeof value === "function" ? value(statsStore.selectedCategoryIds) : value;
      statsStore.setSelectedCategoryIds(next);
    },
    []
  );

  const handleListPageChange = useCallback((page: number) => {
    statsStore.setListPage(page);
  }, []);

  const handleDetailTransactionChange = useCallback((transaction: Transaction | null) => {
    statsStore.setDetailTransaction(transaction);
  }, []);

  const totalPages = Math.max(1, Math.ceil(listTransactions.length / LIST_PAGE_SIZE));
  useEffect(() => {
    if (listPage > totalPages) {
      statsStore.setListPage(totalPages);
    }
  }, [listPage, totalPages]);
  const pagedTransactions = listTransactions.slice(
    (listPage - 1) * LIST_PAGE_SIZE,
    listPage * LIST_PAGE_SIZE
  );

  return {
    i18n: {
      t,
      locale,
      language,
      localeCode,
      currency,
      dateFormat,
      dateTimeFormat,
    },
    summary: {
      range: summaryRange,
      setRange: handleSummaryRangeChange,
      totals,
      local: localSummary,
      server: serverSummary,
    },
    period: {
      range: periodRange,
      setRange: handlePeriodRangeChange,
      mode: periodMode,
      setMode: handlePeriodModeChange,
      data: periodData,
      domainMax: periodDomainMax,
      chartHeight: periodChartHeight,
    },
    category: {
      range: categoryRange,
      setRange: handleCategoryRangeChange,
      chartMode: categoryChartMode,
      setChartMode: handleCategoryChartModeChange,
      data: categoryData,
      chartData: categoryChartData,
      domainMax: categoryDomainMax,
      chartHeight: categoryChartHeight,
      incomePieData,
      expensePieData,
    },
    list: {
      range: listRange,
      setRange: handleListRangeChange,
      selectedCategoryIds,
      setSelectedCategoryIds: handleSelectedCategoryIdsChange,
      selectedCategoryLabel,
      categoryOptions,
      transactions: listTransactions,
      totals: listTotals,
      pagedTransactions,
      totalPages,
      page: listPage,
      setPage: handleListPageChange,
    },
    detail: {
      transaction: detailTx,
      setTransaction: handleDetailTransactionChange,
    },
    categoryMap,
    formatRangeValue,
  };
}

function normalizeRange(range: DateRange | undefined) {
  if (!range?.from) {
    return { start: null, end: null };
  }
  const start = startOfDay(range.from);
  if (!range.to) {
    return { start, end: endOfDay(range.from) };
  }
  const end = endOfDay(range.to);
  if (isAfter(start, end)) {
    return { start, end: endOfDay(start) };
  }
  return { start, end };
}
