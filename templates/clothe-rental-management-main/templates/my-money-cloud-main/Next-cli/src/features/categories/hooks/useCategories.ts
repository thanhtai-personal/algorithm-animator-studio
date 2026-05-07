"use client";

import { useEffect } from "react";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { categoryService } from "@/features/categories/services/categoryService";
import { categoryStore } from "@/store/categoryStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import type { CategoryInput } from "@/features/categories/types";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";

export function useCategories() {
  const { isAnonymous } = useAnonymousChecker();
  const { isOnline } = useOnlineChecker();

  useEffect(() => {
    if (!isAnonymous && isOnline) {
      categoryService.list()
    }
  }, []);

  const createOrUpdateCategory = async (input: CategoryInput) => {
    if (isAnonymous) {
      // Anonymous mode: chỉ update local store
      const id = input.id || Math.random().toString(36).substring(2);
      const category = { ...input, id, user_id: null, created_at: new Date().toISOString() };
      categoryStore.upsert(category);
      return;
    }
    if (isOnline) {
      // Online mode: gọi API tạo mới
      await (input.id ? categoryService.update(input.id, input)
        : categoryService.create(input));
    } else if (!isAnonymous) {
      // Offline mode: thêm vào offline queue
      const id = input.id || Math.random().toString(36).substring(2);
      offlineQueueStore.enqueue({
        id,
        entity: "category",
        action: "create",
        payload: {
          id,
          name: input.name,
          icon: input.icon ?? null,
          color: input.color ?? null,
        },
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (isAnonymous) {
      // Anonymous mode: chỉ update local store
      categoryStore.remove(id);
      return;
    }
    if (isOnline) {
      // Online mode: gọi API xoá
      await categoryService.remove(id);
    } else if (!isAnonymous) {
      // Offline mode: thêm vào offline queue
      offlineQueueStore.enqueue({
        id,
        entity: "category",
        action: "delete",
        payload: { id },
      });
    }
  };

  return {
    createOrUpdateCategory,
    deleteCategory,
  };
}
