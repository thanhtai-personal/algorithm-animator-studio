"use client";

import { useCallback, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  useProductsListQuery,
  useUpdateProductOverviewByIdMutation,
} from "@/features/products/queries/useProductsQueries";
import { useDebouncedValue } from "@/features/products/utils/useDebouncedValue";

const ASSIGNMENT_PAGE_SIZE = 12;

interface ProductCategoryAssignmentCopy {
  title: string;
  description: string;
  searchPlaceholder: string;
  productCodeLabel: string;
  currentCategoryLabel: string;
  noCategoryLabel: string;
  selectedCountLabel: string;
  assignAction: string;
  assigningAction: string;
  closeAction: string;
  empty: string;
  loading: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  assignedSuccess: string;
  assignedFailed: string;
}

const COPY_MAP: Record<AppLocale, ProductCategoryAssignmentCopy> = {
  vi: {
    title: "Thêm sản phẩm",
    description: "Chọn nhiều sản phẩm để gán vào danh mục.",
    searchPlaceholder: "Tìm theo tên hoặc mã sản phẩm...",
    productCodeLabel: "Mã",
    currentCategoryLabel: "Danh mục hiện tại",
    noCategoryLabel: "Chưa có danh mục",
    selectedCountLabel: "Đã chọn",
    assignAction: "Thêm vào danh mục",
    assigningAction: "Đang thêm...",
    closeAction: "Đóng",
    empty: "Không có sản phẩm phù hợp.",
    loading: "Đang tải sản phẩm...",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    assignedSuccess: "Đã thêm sản phẩm vào danh mục.",
    assignedFailed: "Thêm sản phẩm vào danh mục thất bại.",
  },
  en: {
    title: "Add products",
    description: "Select multiple products to assign to this category.",
    searchPlaceholder: "Search by product name or code...",
    productCodeLabel: "Code",
    currentCategoryLabel: "Current category",
    noCategoryLabel: "No category",
    selectedCountLabel: "Selected",
    assignAction: "Add to category",
    assigningAction: "Adding...",
    closeAction: "Close",
    empty: "No matching products.",
    loading: "Loading products...",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    assignedSuccess: "Products added to category.",
    assignedFailed: "Failed to add products to category.",
  },
};

export function useProductCategoryAssignmentDrawer(options: {
  locale: AppLocale;
  branchId: string | null;
  categoryId: string | null;
  open: boolean;
}) {
  const copy = COPY_MAP[options.locale];
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const query = useProductsListQuery(
    {
      branchId: options.branchId,
      search: debouncedSearch,
      page,
      pageSize: ASSIGNMENT_PAGE_SIZE,
    },
    { enabled: options.open && Boolean(options.branchId) }
  );
  const updateMutation = useUpdateProductOverviewByIdMutation();

  const items = query.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / ASSIGNMENT_PAGE_SIZE));
  const selectedProductIdSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds]
  );

  const resetSelection = useCallback(() => {
    setSearchInput("");
    setPage(1);
    setSelectedProductIds([]);
  }, []);

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((previous) =>
      previous.includes(productId)
        ? previous.filter((entry) => entry !== productId)
        : [...previous, productId]
    );
  }, []);

  const assignSelectedProducts = useCallback(async () => {
    if (!options.categoryId || selectedProductIds.length === 0) return;

    for (const productId of selectedProductIds) {
      await updateMutation.mutateAsync({
        productId,
        payload: {
          productCategoryId: options.categoryId,
        },
      });
    }

    setSelectedProductIds([]);
  }, [options.categoryId, selectedProductIds, updateMutation]);

  return {
    copy,
    query,
    updateMutation,
    searchInput,
    setSearchInput,
    page,
    setPage,
    items,
    totalPages,
    selectedProductIds,
    selectedProductIdSet,
    resetSelection,
    toggleProduct,
    assignSelectedProducts,
  };
}
