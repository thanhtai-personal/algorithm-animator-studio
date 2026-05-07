"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CUSTOM_CATEGORY_COLOR,
  CUSTOM_CATEGORY_ICON,
  FALLBACK_CATEGORY_ID,
  getAllCategoryIconOptions,
  normalizeCategoryId,
} from "@/features/categories/constants";
import type { CategoryRow } from "@/features/categories/types";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { useI18n } from "@/lib/i18n";
import { getCurrencySymbol } from "@/lib/currency";
import type { TransactionInput, TransactionType } from "@/features/transactions/types";
import { categoryStore } from "@/store/categoryStore";

type UseAddTransactionFormParams = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: TransactionInput) => Promise<boolean>;
  initialTransaction?: TransactionInput | null;
};

export function useAddTransactionForm({ isOpen, onClose, onAdd, initialTransaction }: UseAddTransactionFormParams) {
  const { isOnline } = useOnlineChecker();
  const { t, localeCode, currency } = useI18n();
  const currencySymbol = getCurrencySymbol(currency, localeCode);
  const { createOrUpdateCategory, deleteCategory } = useCategories();
  const { categories } = categoryStore;

  const [type, setType] = useState<TransactionType>(initialTransaction?.type || "expense");
  const [amount, setAmount] = useState(initialTransaction?.amount?.toString() || "");
  const [description, setDescription] = useState(initialTransaction?.description || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTransaction?.categoryId || "");
  const [isCategoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState(CUSTOM_CATEGORY_ICON);
  const [selectedCategoryColor, setSelectedCategoryColor] = useState(CUSTOM_CATEGORY_COLOR);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const iconOptions = useMemo(() => getAllCategoryIconOptions(), []);

  useEffect(() => {
    if (!isOpen) {
      setInitialLoadDone(false);
      return;
    }
    if (initialLoadDone) return;

    if (initialTransaction) {
      const itx = initialTransaction;
      setType(itx.type);
      setAmount(itx.amount?.toString() || "");
      setDescription(itx.description || "");

      let resolvedId = "";
      if (itx.categoryId) {
        const normalized = normalizeCategoryId(itx.categoryId);
        if (categories.some((c: any) => c.id === normalized)) {
          resolvedId = normalized;
        } else {
          const lower = itx.categoryId.toLowerCase();
          const found = categories.find((c: any) => {
            const name = (c.name || "").toLowerCase();
            return name === lower || name.includes(lower) || lower.includes(name);
          });
          resolvedId = found?.id || FALLBACK_CATEGORY_ID;
        }
      } else {
        resolvedId = FALLBACK_CATEGORY_ID;
      }
      setSelectedCategory(resolvedId);
    } else {
      setType("expense");
      setAmount("");
      setDescription("");
      setSelectedCategory(FALLBACK_CATEGORY_ID);
    }

    setInitialLoadDone(true);
  }, [categories, initialLoadDone, initialTransaction, isOpen]);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const categoryExists = categories.some((cat: any) => cat.id === selectedCategory);
      if (!categoryExists) {
        setSelectedCategory(FALLBACK_CATEGORY_ID);
      }
    }
  }, [categories, selectedCategory, type]);

  useEffect(() => {
    if (!isCategoryDrawerOpen) return;
    const fallback = iconOptions[0];
    if (fallback) {
      setSelectedCategoryIcon(fallback.icon);
      setSelectedCategoryColor(fallback.color);
      return;
    }
    setSelectedCategoryIcon(CUSTOM_CATEGORY_ICON);
    setSelectedCategoryColor(CUSTOM_CATEGORY_COLOR);
  }, [iconOptions, isCategoryDrawerOpen]);

  const handleAmountChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    setAmount(onlyDigits);
  };

  const handleTypeChange = useCallback((newType: TransactionType) => {
    setType(newType);
  }, []);

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) return;

    const selectedCategoryData = categories.find((cat: any) => cat.id === selectedCategory);

    const success = await onAdd({
      amount: parseInt(amount, 10),
      description: description || (selectedCategoryData ? selectedCategoryData.name : ""),
      categoryId: selectedCategory,
      type,
      date: new Date(),
    });

    if (!success) return;
    handleClose();
  };

  const handleClose = () => {
    setType(initialTransaction?.type || "expense");
    setAmount(initialTransaction?.amount?.toString() || "");
    setDescription(initialTransaction?.description || "");
    setSelectedCategory(initialTransaction?.categoryId || "");
    setCategoryDrawerOpen(false);
    setNewCategoryName("");
    setDeleteTarget(null);
    setInitialLoadDone(false);
    onClose();
  };

  const canSubmit = parseInt(amount, 10) > 0 && Boolean(selectedCategory);

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error(t("categories.nameRequired"));
      return;
    }

    if (!isOnline) {
      // Offline: queue category create
      const id = Date.now().toString();
      offlineQueueStore.enqueue({
        id: `offline-category-create-${id}`,
        entity: "category",
        action: "create",
        payload: {
          id,
          name: trimmed,
          icon: selectedCategoryIcon,
          color: selectedCategoryColor,
        },
      });
      setSelectedCategory(id);
      setNewCategoryName("");
      setCategoryDrawerOpen(false);
      toast.success(t("categories.createSuccess"));
      return;
    }

    try {
      const createdResult = await createOrUpdateCategory({
        name: trimmed,
        icon: selectedCategoryIcon,
        color: selectedCategoryColor,
      });
      const created = Array.isArray(createdResult) ? createdResult[0] : createdResult;
      if (created) {
        setSelectedCategory(created.id);
      }
      setNewCategoryName("");
      setCategoryDrawerOpen(false);
      toast.success(t("categories.createSuccess"));
    } catch {
      toast.error(t("categories.createFailed"));
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;

    if (!isOnline) {
      // Offline: queue category delete
      offlineQueueStore.enqueue({
        id: `offline-category-delete-${deleteTarget.id}`,
        entity: "category",
        action: "delete",
        payload: { id: deleteTarget.id },
      });
      if (selectedCategory === deleteTarget.id) {
        setSelectedCategory("");
      }
      toast.success(t("categories.deleteSuccess"));
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteCategory(deleteTarget.id);
      if (selectedCategory === deleteTarget.id) {
        setSelectedCategory("");
      }
      toast.success(t("categories.deleteSuccess"));
    } catch {
      toast.error(t("categories.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  };

  return {
    t,
    localeCode,
    currency,
    currencySymbol,
    categories,
    iconOptions,
    creating: false,
    deleting: false,
    state: {
      type,
      amount,
      description,
      selectedCategory,
      isCategoryDrawerOpen,
      newCategoryName,
      selectedCategoryIcon,
      selectedCategoryColor,
      deleteTarget,
      canSubmit,
    },
    actions: {
      setType: handleTypeChange,
      setAmount: handleAmountChange,
      setDescription,
      setSelectedCategory,
      setCategoryDrawerOpen,
      setNewCategoryName,
      setSelectedCategoryIcon,
      setSelectedCategoryColor,
      setDeleteTarget,
      handleSubmit,
      handleClose,
      handleCreateCategory,
      handleDeleteCategory,
    },
  };
}
