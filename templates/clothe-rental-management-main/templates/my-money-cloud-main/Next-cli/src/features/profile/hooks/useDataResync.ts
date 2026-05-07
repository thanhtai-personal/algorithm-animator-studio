"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { categoryQueryKeys } from "@/features/categories/queries/keys";
import { transactionQueryKeys } from "@/features/transactions/queries/keys";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_IDS } from "@/features/categories/constants";
import type { CategoryRow } from "@/features/categories/types";
import { useI18n } from "@/lib/i18n";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { authStore } from "@/store/authStore";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { toast } from "sonner";
import { categoryService } from "@/features/categories/services/categoryService";
import { transactionService } from "@/features/transactions/services/transactionService";

export const useDataResync = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const userId = authStore.userId || authStore.anonId;
  const isAnonymous = !authStore.userId;

  const getDefaultCategories = (): CategoryRow[] => {
    if (!isAnonymous) return [];
    const defaultCategoryIds = new Set<string>(Object.values(DEFAULT_CATEGORY_IDS));
    const preserved = categoryStore.categories.filter((category) => defaultCategoryIds.has(category.id));
    if (preserved.length > 0) return preserved;

    const createdAt = new Date().toISOString();
    const anonKey = authStore.anonId ?? null;
    return DEFAULT_CATEGORIES.map((category) => ({
      id: category.id,
      user_id: null,
      anon_key: authStore.userId ? null : anonKey,
      name: t(category.nameKey) || category.nameKey,
      icon: category.icon,
      color: category.color,
      created_at: createdAt,
    }));
  };

  const handleResync = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const defaultCategories = getDefaultCategories();
      offlineQueueStore.clear(userId);
      categoryStore.clear();
      transactionStore.clear();
      if (defaultCategories.length > 0) {
        categoryStore.write(defaultCategories);
      }

      // Xóa cache React Query
      queryClient.clear();
      queryClient.removeQueries({ queryKey: categoryQueryKeys.all });
      queryClient.removeQueries({ queryKey: transactionQueryKeys.all });

      if (authStore.userId) {
        const categoriesPromise = categoryService.list();

        const start = new Date("2025-01-01T00:00:00.000Z");
        const end = new Date();
        const transactionsPromise = transactionService.listByRange({ start, end });

        const [categories, transactions] = await Promise.all([
          categoriesPromise,
          transactionsPromise
        ]);
        categoryStore.write(categories);
        transactionStore.write(transactions);
      }

      toast.success(t("resync.success"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("resync.error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleResync,
    loading
  }
}
