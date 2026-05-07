"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { categoryStore } from "@/store/categoryStore";


export function useDeleteCategoryMutation() {
  const { t } = useI18n();
  return useMutation({
    mutationFn: async (id: string) => {
      categoryStore.remove(id);
      return id;
    },
    onSuccess: (id) => {
      toast.success(t("categories.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("categories.deleteFailed"));
    },
  });
}
