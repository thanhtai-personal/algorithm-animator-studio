"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import {
  useCreateSettingsProductCategoryMutation,
  useDeleteSettingsProductCategoryMutation,
  useSettingsProductCategoriesQuery,
  useUpdateSettingsProductCategoryMutation,
} from "@/features/settings/queries/useSettingsQueries";
import { settingsStore } from "@/features/settings/stores/settingsStore";

interface SettingsCategoriesCopy {
  title: string;
  subtitle: string;
  branchLabel: string;
  createTitle: string;
  editTitle: string;
  editDescription: string;
  editAction: string;
  codeLabel: string;
  nameLabel: string;
  sortOrderLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  productCountLabel: string;
  systemLabel: string;
  createAction: string;
  listTitle: string;
  saveAction: string;
  deleteAction: string;
  tableCode: string;
  tableName: string;
  tableSortOrder: string;
  tableStatus: string;
  tableProductCount: string;
  tableActions: string;
  inUseHint: string;
  emptyList: string;
  retryAction: string;
  loading: string;
  loadError: string;
  missingBranchContext: string;
  invalidSortOrder: string;
  confirmDelete: string;
  successCreate: string;
  successUpdate: string;
  successDelete: string;
}

const CATEGORIES_COPY: Record<AppLocale, SettingsCategoriesCopy> = {
  vi: {
    title: "Danh mục sản phẩm",
    subtitle: "Quản lý danh mục cho form tạo/sửa sản phẩm theo từng chi nhánh.",
    branchLabel: "Chi nhánh",
    createTitle: "Tạo danh mục mới",
    editTitle: "Chỉnh sửa danh mục",
    editDescription: "Cập nhật thông tin danh mục sản phẩm.",
    editAction: "Sửa",
    codeLabel: "Mã danh mục",
    nameLabel: "Tên danh mục",
    sortOrderLabel: "Thứ tự",
    activeLabel: "Hoạt động",
    inactiveLabel: "Ngưng hoạt động",
    productCountLabel: "Số sản phẩm đang dùng",
    systemLabel: "System",
    createAction: "Tạo danh mục",
    listTitle: "Danh sách danh mục",
    saveAction: "Lưu",
    deleteAction: "Xóa",
    tableCode: "Mã",
    tableName: "Tên danh mục",
    tableSortOrder: "Thứ tự",
    tableStatus: "Trạng thái",
    tableProductCount: "Số sản phẩm",
    tableActions: "Thao tác",
    inUseHint: "Danh mục đã gán cho sản phẩm, không thể xóa.",
    emptyList: "Chưa có danh mục nào.",
    retryAction: "Thử lại",
    loading: "Đang tải danh mục...",
    loadError: "Tải danh mục thất bại.",
    missingBranchContext: "Thiếu ngữ cảnh chi nhánh.",
    invalidSortOrder: "Thứ tự phải là số nguyên không âm.",
    confirmDelete: "Xác nhận xóa danh mục này?",
    successCreate: "Đã tạo danh mục.",
    successUpdate: "Đã cập nhật danh mục.",
    successDelete: "Đã xóa danh mục.",
  },
  en: {
    title: "Product categories",
    subtitle: "Manage categories used by product create/edit forms per branch.",
    branchLabel: "Branch",
    createTitle: "Create category",
    editTitle: "Edit category",
    editDescription: "Update product category details.",
    editAction: "Edit",
    codeLabel: "Category code",
    nameLabel: "Category name",
    sortOrderLabel: "Sort order",
    activeLabel: "Active",
    inactiveLabel: "Inactive",
    productCountLabel: "Product usage",
    systemLabel: "System",
    createAction: "Create category",
    listTitle: "Category list",
    saveAction: "Save",
    deleteAction: "Delete",
    tableCode: "Code",
    tableName: "Category",
    tableSortOrder: "Sort",
    tableStatus: "Status",
    tableProductCount: "Products",
    tableActions: "Actions",
    inUseHint: "Category is assigned to products and cannot be deleted.",
    emptyList: "No categories found.",
    retryAction: "Retry",
    loading: "Loading categories...",
    loadError: "Failed to load categories.",
    missingBranchContext: "Missing branch context.",
    invalidSortOrder: "Sort order must be a non-negative integer.",
    confirmDelete: "Delete this category?",
    successCreate: "Category created.",
    successUpdate: "Category updated.",
    successDelete: "Category deleted.",
  },
};

interface CategoryRowDraft {
  code: string;
  name: string;
  sortOrder: string;
  isActive: boolean;
}

function parseSortOrderInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

export function useSettingsCategoriesPage(locale: AppLocale) {
  const copy = CATEGORIES_COPY[locale];

  const [branchId, setBranchId] = useState<string | null>(null);

  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSortOrder, setCreateSortOrder] = useState("0");
  const [createIsActive, setCreateIsActive] = useState(true);

  const [rowDraftById, setRowDraftById] = useState<Record<string, CategoryRowDraft>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const query = useSettingsProductCategoriesQuery(branchId);
  const createMutation = useCreateSettingsProductCategoryMutation();
  const updateMutation = useUpdateSettingsProductCategoryMutation();
  const deleteMutation = useDeleteSettingsProductCategoryMutation();

  const categoriesPayload = settingsStore.productCategories;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!categoriesPayload) return;

    const hasSelectedBranch = categoriesPayload.branches.some((entry) => entry.id === branchId);
    if (!branchId || !hasSelectedBranch) {
      setBranchId(categoriesPayload.branchId);
    }

    const nextDraftById: Record<string, CategoryRowDraft> = {};
    for (const row of categoriesPayload.items) {
      nextDraftById[row.id] = {
        code: row.code,
        name: row.name,
        sortOrder: String(row.sortOrder),
        isActive: row.isActive,
      };
    }
    setRowDraftById(nextDraftById);
  }, [branchId, categoriesPayload, query.data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const branchOptions = useMemo(
    () =>
      (categoriesPayload?.branches ?? []).map((entry) => ({
        value: entry.id,
        label: `${entry.code} - ${entry.name}`,
      })),
    [categoriesPayload?.branches]
  );

  const setRowDraft = (productCategoryId: string, patch: Partial<CategoryRowDraft>) => {
    setRowDraftById((previous) => ({
      ...previous,
      [productCategoryId]: {
        ...previous[productCategoryId],
        ...patch,
      },
    }));
  };

  const onCreateCategory = async () => {
    const targetBranchId = branchId ?? categoriesPayload?.branchId ?? null;
    if (!targetBranchId) {
      setActionError(copy.missingBranchContext);
      toast.error(copy.missingBranchContext);
      return;
    }

    const sortOrder = parseSortOrderInput(createSortOrder);
    if (sortOrder === null) {
      setActionError(copy.invalidSortOrder);
      toast.error(copy.invalidSortOrder);
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await createMutation.mutateAsync({
        branchId: targetBranchId,
        code: createCode,
        name: createName,
        sortOrder,
        isActive: createIsActive,
      });

      setCreateCode("");
      setCreateName("");
      setCreateSortOrder("0");
      setCreateIsActive(true);
      setActionSuccess(copy.successCreate);
      toast.success(copy.successCreate);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  const onUpdateCategory = async (productCategoryId: string) => {
    const draft = rowDraftById[productCategoryId];
    if (!draft) return false;

    const sortOrder = parseSortOrderInput(draft.sortOrder);
    if (sortOrder === null) {
      setActionError(copy.invalidSortOrder);
      toast.error(copy.invalidSortOrder);
      return false;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      await updateMutation.mutateAsync({
        productCategoryId,
        payload: {
          code: draft.code,
          name: draft.name,
          sortOrder,
          isActive: draft.isActive,
        },
      });

      setActionSuccess(copy.successUpdate);
      toast.success(copy.successUpdate);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
      return false;
    }
  };

  const onDeleteCategory = async (productCategoryId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await deleteMutation.mutateAsync(productCategoryId);
      setActionSuccess(copy.successDelete);
      toast.success(copy.successDelete);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  return {
    copy,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
    categoriesPayload,
    branchId,
    setBranchId,
    branchOptions,
    createCode,
    setCreateCode,
    createName,
    setCreateName,
    createSortOrder,
    setCreateSortOrder,
    createIsActive,
    setCreateIsActive,
    rowDraftById,
    setRowDraft,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
    actionError,
    actionSuccess,
  };
}
