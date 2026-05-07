"use client";

import { useMutation } from "@tanstack/react-query";
import type { CategoryInput, CategoryRow } from "@/features/categories/types";
import { categoryStore } from "@/store/categoryStore";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function useUpdateCategoryMutation() {
  const { t } = useI18n();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CategoryInput }) => {
      const existing = categoryStore.findById(id);
      if (!existing) throw new Error("Category not found");
      const updated: CategoryRow = {
        ...existing,
        ...input,
        icon: input.icon ?? existing.icon ?? null,
        color: input.color ?? existing.color ?? null,
      };
      categoryStore.upsert(updated);
      return updated;
    },
    onSuccess: () => {
      toast.success(t("categories.updateSuccess"));
    },
    onError: () => {
      toast.error(t("categories.updateFailed"));
    },
  });
}
