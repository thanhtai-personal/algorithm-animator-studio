"use client";

import { useCallback, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { ITEM_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useBulkUpdateInventoryItemStatusMutation,
  useInventoryListQuery,
} from "@/features/inventory/queries/useInventoryQueries";
import { inventoryStore } from "@/features/inventory/stores/inventoryStore";
import type { ItemStatus } from "@/types/domainPrimitives";
import type {
  InventoryBulkStatusUpdateResultDto,
  InventoryListItemDto,
} from "@/types/inventoryItems";
import { buildDomainLabels } from "@/utils/domainLabels";

interface SalesStockCopy {
  title: string;
  searchPlaceholder: string;
  allCategories: string;
  allStatuses: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  noResult: string;
  readySummarySuffix: string;
  tableHeaders: {
    select: string;
    item: string;
    variant: string;
    size: string;
    color: string;
    status: string;
  };
  bulkSelectedLabel: string;
  bulkSelectAllInView: string;
  bulkClearSelection: string;
  bulkMarkReady: string;
}

const SALES_STOCK_COPY: Record<AppLocale, SalesStockCopy> = {
  vi: {
    title: "Tra cứu tồn kho",
    searchPlaceholder: "Tìm theo tên sản phẩm / mã item...",
    allCategories: "Tất cả danh mục",
    allStatuses: "Tất cả trạng thái",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    noResult: "Không có dữ liệu tồn kho phù hợp.",
    readySummarySuffix: "sẵn",
    tableHeaders: {
      select: "Chọn",
      item: "Mã item",
      variant: "Biến thể",
      size: "Kích thước",
      color: "Màu sắc",
      status: "Trạng thái",
    },
    bulkSelectedLabel: "item được chọn",
    bulkSelectAllInView: "Chọn tất cả trong màn hình",
    bulkClearSelection: "Bỏ chọn",
    bulkMarkReady: "Đánh dấu sẵn sàng",
  },
  en: {
    title: "Stock lookup",
    searchPlaceholder: "Search by product name / item code...",
    allCategories: "All categories",
    allStatuses: "All statuses",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    noResult: "No matching inventory found.",
    readySummarySuffix: "ready",
    tableHeaders: {
      select: "Select",
      item: "Item",
      variant: "Variant",
      size: "Size",
      color: "Color",
      status: "Status",
    },
    bulkSelectedLabel: "selected items",
    bulkSelectAllInView: "Select all in view",
    bulkClearSelection: "Clear selection",
    bulkMarkReady: "Mark as ready",
  },
};

type StockGroup = {
  productId: string;
  productName: string;
  categoryName: string | null;
  coverImagePath: string | null;
  readyCount: number;
  totalCount: number;
  items: InventoryListItemDto[];
};

const STATUS_FILTER_VALUES: Array<ItemStatus | "ALL"> = [
  "ALL",
  "READY",
  "RESERVED",
  "ON_RENT",
  "LAUNDRY",
  "MAINTENANCE",
  "DAMAGED",
  "LOST",
  "SOLD",
  "RETIRED",
];
const SALES_STOCK_PAGE_SIZE = 120;

export function useSalesStockPage(locale: AppLocale) {
  const copy = SALES_STOCK_COPY[locale];
  const { currentBranchId } = useAuthAccess();

  const [search, setSearch] = useState("");
  const [productCategoryId, setProductCategoryId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const bulkStatusMutation = useBulkUpdateInventoryItemStatusMutation();

  useInventoryListQuery({
    branchId: currentBranchId,
    excludeSold: statusFilter === "ALL",
    productCategoryId: productCategoryId === "ALL" ? null : productCategoryId,
    status: statusFilter === "ALL" ? null : statusFilter,
    search,
    page,
    pageSize: SALES_STOCK_PAGE_SIZE,
  });

  const inventoryItems = inventoryStore.listItems;
  const categories = inventoryStore.categories;
  const totalPages = (() => {
    if (inventoryStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(inventoryStore.listTotal / inventoryStore.listPageSize));
  })();
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
    [locale]
  );
  const statusFilterOptions = useMemo(
    () =>
      STATUS_FILTER_VALUES.map((value) => ({
        value,
        label: value === "ALL" ? copy.allStatuses : itemStatusLabels[value],
      })),
    [copy.allStatuses, itemStatusLabels]
  );

  const groupedItems = useMemo<StockGroup[]>(() => {
    const map = new Map<string, StockGroup>();

    for (const item of inventoryItems) {
      const existing = map.get(item.productId);
      if (existing) {
        existing.items.push(item);
        existing.totalCount += 1;
        if (item.status === "READY") {
          existing.readyCount += 1;
        }
        continue;
      }

      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        coverImagePath: item.coverImagePath,
        readyCount: item.status === "READY" ? 1 : 0,
        totalCount: 1,
        items: [item],
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );
  }, [inventoryItems]);

  const visibleItemIds = useMemo(
    () => groupedItems.flatMap((group) => group.items.map((item) => item.id)),
    [groupedItems]
  );
  const visibleItemIdSet = useMemo(() => new Set(visibleItemIds), [visibleItemIds]);
  const selectedVisibleItemIds = selectedItemIds.filter((itemId) =>
    visibleItemIdSet.has(itemId)
  );
  const selectedItemIdSet = new Set(selectedVisibleItemIds);
  const allVisibleItemsSelected =
    visibleItemIds.length > 0 && visibleItemIds.every((itemId) => selectedItemIdSet.has(itemId));

  const toggleItemSelection = useCallback((itemId: string, selected: boolean) => {
    setSelectedItemIds((previous) => {
      if (selected) {
        if (previous.includes(itemId)) return previous;
        return [...previous, itemId];
      }
      return previous.filter((id) => id !== itemId);
    });
  }, []);

  const setSelectAllVisible = useCallback(
    (selected: boolean) => {
      if (!selected) {
        setSelectedItemIds([]);
        return;
      }
      setSelectedItemIds(visibleItemIds);
    },
    [visibleItemIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedItemIds([]);
  }, []);

  const submitMarkSelectedReady = useCallback(async (): Promise<InventoryBulkStatusUpdateResultDto> => {
    const result = await bulkStatusMutation.mutateAsync({
      itemIds: selectedVisibleItemIds,
      toStatus: "READY",
      reasonCode: "LAUNDRY_COMPLETED",
    });

    const succeededIdSet = new Set(result.succeededItemIds);
    setSelectedItemIds((previous) =>
      previous.filter((itemId) => !succeededIdSet.has(itemId))
    );

    return result;
  }, [bulkStatusMutation, selectedVisibleItemIds]);

  return {
    copy,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    productCategoryId,
    setProductCategoryId: (value: string) => {
      setProductCategoryId(value);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (value: ItemStatus | "ALL") => {
      setStatusFilter(value);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    statusFilterOptions,
    categories,
    groupedItems,
    selectedItemIds: selectedVisibleItemIds,
    selectedItemIdSet,
    allVisibleItemsSelected,
    toggleItemSelection,
    setSelectAllVisible,
    clearSelection,
    submitMarkSelectedReady,
    bulkStatusMutation,
  };
}
