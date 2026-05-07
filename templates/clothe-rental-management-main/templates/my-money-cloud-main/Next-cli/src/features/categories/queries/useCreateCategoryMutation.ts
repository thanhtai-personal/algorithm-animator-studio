"use client";

import { useMutation } from "@tanstack/react-query";
import { categoryService } from "@/features/categories/services/categoryService";
import { categoryStore } from "@/store/categoryStore";
import type { CategoryInput, CategoryRow } from "@/features/categories/types";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";

export function useCreateCategoryMutation() {
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  const createLocalCategory = (input: CategoryInput): CategoryRow => {
    const cryptoObj = globalThis.crypto;
    const id =
      input.id ||
      (cryptoObj?.randomUUID ? cryptoObj.randomUUID() : Math.random().toString(36).slice(2));
    return {
      id,
      user_id: authStore.userId ?? null,
      anon_key: authStore.anonId ?? null,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      created_at: new Date().toISOString(),
    };
  };

  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      if (isAnonymous || !isOnline) {
        const localCategory = createLocalCategory(input);
        if (!isAnonymous && authStore.userId && !isOnline) {
          offlineQueueStore.enqueue(
            {
              id: `offline-category-create-${localCategory.id}`,
              entity: "category",
              action: "create",
              payload: {
                id: localCategory.id,
                name: localCategory.name,
                icon: localCategory.icon ?? null,
                color: localCategory.color ?? null,
              },
            },
            authStore.userId
          );
        }
        return localCategory;
      }
      return categoryService.create(input);
    },
    onSuccess: (data) => {
      categoryStore.upsert(data);
    },
  });
}
