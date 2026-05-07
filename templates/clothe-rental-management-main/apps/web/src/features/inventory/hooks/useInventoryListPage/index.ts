"use client";

import { useCallback, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  INVENTORY_DEFAULT_PAGE_SIZE,
  INVENTORY_STATUS_VALUES,
} from "@/features/inventory/constants";
import {
  useCreateInventoryProductItemsMutation,
  useInventoryListQuery,
  useInventoryProductListQuery,
  useInventoryProductOptionsQuery,
} from "@/features/inventory/queries/useInventoryQueries";
import { inventoryClientService } from "@/features/inventory/services/inventoryClientService";
import { inventoryStore } from "@/features/inventory/stores/inventoryStore";
import {
  findDuplicateItemCodes,
  parseItemCodesFromText,
  uniqueItemCodes,
} from "@/features/inventory/utils/itemBatch";
import { useDebouncedValue } from "@/features/inventory/utils/useDebouncedValue";
import { ITEM_STATUS_LABELS } from "@/features/inventory/utils/statusPresentation";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import type { ItemStatus } from "@/types/domainPrimitives";
import type { InventoryListViewMode } from "@/types/inventoryItems";
import { ADD_ITEM_INITIAL_STATUS_VALUES } from "./constants";
import { INVENTORY_LIST_COPY } from "./copy";
import type { AddItemDraft, AddItemFieldErrorKey, AddItemFieldErrors } from "./types";
import { buildInitialAddItemDraft, resolveAddItemErrorMessage } from "./utils";

export function useInventoryListPage(locale: AppLocale) {
  const copy = INVENTORY_LIST_COPY[locale];
  const { currentBranchId, branchAccess, can } = useAuthAccess();
  const canSetSoldStatus = can("products.edit_pricing");

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<InventoryListViewMode>("items");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemProductSearchInput, setAddItemProductSearchInput] = useState("");
  const [addItemDraft, setAddItemDraft] = useState<AddItemDraft>(buildInitialAddItemDraft);
  const [addItemFieldErrors, setAddItemFieldErrors] = useState<AddItemFieldErrors>({});

  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const debouncedProductSearch = useDebouncedValue(addItemProductSearchInput, 250);
  const selectedBranchId = branchFilter || currentBranchId || null;

  const itemListQuery = useInventoryListQuery(
    {
      viewMode: "items",
      branchId: selectedBranchId,
      status: statusFilter || null,
      productCategoryId: productCategoryId || null,
      size: sizeFilter || null,
      search: debouncedSearch,
      page,
      pageSize: INVENTORY_DEFAULT_PAGE_SIZE,
    },
    {
      enabled: viewMode === "items",
    }
  );
  const productListQuery = useInventoryProductListQuery({
    query: {
      viewMode: "products",
      branchId: selectedBranchId,
      status: statusFilter || null,
      productCategoryId: productCategoryId || null,
      size: sizeFilter || null,
      search: debouncedSearch,
      page,
      pageSize: INVENTORY_DEFAULT_PAGE_SIZE,
    },
    enabled: viewMode === "products",
  });

  const productOptionsQuery = useInventoryProductOptionsQuery({
    query: {
      branchId: selectedBranchId,
      search: debouncedProductSearch,
      pageSize: 40,
    },
    enabled: addItemOpen && Boolean(selectedBranchId),
  });
  const addItemsMutation = useCreateInventoryProductItemsMutation();

  const totalPages = (() => {
    const activeTotal =
      viewMode === "items" ? inventoryStore.listTotal : inventoryStore.productListTotal;
    const activePageSize =
      viewMode === "items" ? inventoryStore.listPageSize : inventoryStore.productListPageSize;

    if (activeTotal <= 0) return 1;
    return Math.max(1, Math.ceil(activeTotal / activePageSize));
  })();

  const statusOptions = useMemo(
    () =>
      INVENTORY_STATUS_VALUES.map((status) => ({
        value: status,
        label: ITEM_STATUS_LABELS[locale][status],
      })),
    [locale]
  );
  const addItemInitialStatusOptions = useMemo(
    () =>
      ADD_ITEM_INITIAL_STATUS_VALUES
        .filter((status) => canSetSoldStatus || status !== "SOLD")
        .map((status) => ({
          value: status,
          label: ITEM_STATUS_LABELS[locale][status],
        })),
    [canSetSoldStatus, locale]
  );

  const branchOptions = Array.from(
    new Set([
      ...branchAccess.map((entry) => entry.branchId),
      ...inventoryStore.branchOptions,
    ])
  ).sort((a, b) => a.localeCompare(b));
  const addItemProductOptions = productOptionsQuery.data?.items ?? [];

  const listItems = inventoryStore.listItems.map((entry) => ({
    ...entry,
    coverImageUrl: inventoryClientService.resolveCoverImageUrl(entry.coverImagePath),
    statusLabel: ITEM_STATUS_LABELS[locale][entry.status],
    lastMovementLabel: entry.lastMovementToStatus
      ? ITEM_STATUS_LABELS[locale][entry.lastMovementToStatus]
      : null,
  }));

  const productListItems = inventoryStore.productListItems.map((entry) => ({
    ...entry,
    coverImageUrl: inventoryClientService.resolveCoverImageUrl(entry.coverImagePath),
  }));

  const resetAddItemDraft = useCallback(() => {
    setAddItemDraft(buildInitialAddItemDraft());
    setAddItemFieldErrors({});
    setAddItemProductSearchInput("");
  }, []);

  const openAddItemPanel = useCallback(() => {
    addItemsMutation.reset();
    resetAddItemDraft();
    setAddItemOpen(true);
  }, [addItemsMutation, resetAddItemDraft]);

  const closeAddItemPanel = useCallback(() => {
    setAddItemOpen(false);
    resetAddItemDraft();
  }, [resetAddItemDraft]);

  const setAddItemDraftField = useCallback(
    <K extends keyof AddItemDraft>(field: K, value: AddItemDraft[K]) => {
      setAddItemDraft((previous) => ({
        ...previous,
        [field]: value,
      }));
      setAddItemFieldErrors((previous) => {
        if (!previous[field as AddItemFieldErrorKey]) return previous;
        const next = { ...previous };
        delete next[field as AddItemFieldErrorKey];
        return next;
      });
    },
    []
  );

  const submitAddItems = useCallback(async () => {
    const errors: AddItemFieldErrors = {};

    if (!selectedBranchId) {
      errors.branchId = copy.addItemBranchRequiredError;
    }

    if (!addItemDraft.productId) {
      errors.productId = copy.addItemRequiredProductError;
    }

    const parsedItemCodes = parseItemCodesFromText(addItemDraft.itemCodesText);
    if (parsedItemCodes.length === 0) {
      errors.itemCodesText = copy.addItemRequiredItemCodesError;
    }

    if (findDuplicateItemCodes(parsedItemCodes).length > 0) {
      errors.itemCodesText = copy.addItemDuplicatePayloadError;
    }

    if (!canSetSoldStatus && addItemDraft.initialStatus === "SOLD") {
      errors.initialStatus = copy.addItemForbiddenSoldError;
    }

    if (Object.keys(errors).length > 0) {
      setAddItemFieldErrors(errors);
      const firstMessage =
        errors.branchId ??
        errors.productId ??
        errors.itemCodesText ??
        errors.initialStatus ??
        copy.addItemFailed;
      throw new Error(firstMessage);
    }

    setAddItemFieldErrors({});

    const normalizedItemSize = addItemDraft.itemSize.trim() || null;
    const uniqueCodes = uniqueItemCodes(parsedItemCodes);
    await addItemsMutation.mutateAsync({
      productId: addItemDraft.productId,
      items: uniqueCodes.map((itemCode) => ({
        itemCode,
        initialStatus: addItemDraft.initialStatus,
        size: normalizedItemSize,
      })),
    });

    closeAddItemPanel();
  }, [
    addItemDraft.initialStatus,
    addItemDraft.itemCodesText,
    addItemDraft.itemSize,
    addItemDraft.productId,
    addItemsMutation,
    canSetSoldStatus,
    closeAddItemPanel,
    copy.addItemBranchRequiredError,
    copy.addItemDuplicatePayloadError,
    copy.addItemFailed,
    copy.addItemForbiddenSoldError,
    copy.addItemRequiredItemCodesError,
    copy.addItemRequiredProductError,
    selectedBranchId,
  ]);

  const activeListQuery = viewMode === "items" ? itemListQuery : productListQuery;

  return {
    copy,
    viewMode,
    setViewMode: (value: InventoryListViewMode) => {
      setViewMode(value);
      setPage(1);
    },
    searchInput,
    setSearchInput: (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (value: ItemStatus | "") => {
      setStatusFilter(value);
      setPage(1);
    },
    productCategoryId,
    setProductCategoryId: (value: string) => {
      setProductCategoryId(value);
      setPage(1);
    },
    sizeFilter,
    setSizeFilter: (value: string) => {
      setSizeFilter(value);
      setPage(1);
    },
    branchFilter,
    setBranchFilter: (value: string) => {
      setBranchFilter(value);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    listQuery: activeListQuery,
    listItems,
    productListItems,
    listTotal:
      viewMode === "items" ? inventoryStore.listTotal : inventoryStore.productListTotal,
    categories: inventoryStore.categories,
    sizes: inventoryStore.sizes,
    branchOptions,
    statusOptions,
    addItemOpen,
    addItemDraft,
    setAddItemDraftField,
    addItemFieldErrors,
    addItemProductSearchInput,
    setAddItemProductSearchInput,
    addItemProductOptions,
    addItemInitialStatusOptions,
    openAddItemPanel,
    closeAddItemPanel,
    submitAddItems,
    productOptionsQuery,
    addItemsMutation,
    resolveAddItemErrorMessage: (error: unknown, fallback: string) =>
      resolveAddItemErrorMessage({
        error,
        copy,
        fallback,
      }),
  };
}
