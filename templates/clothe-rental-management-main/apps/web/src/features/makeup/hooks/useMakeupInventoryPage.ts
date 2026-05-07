"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateMakeupInventoryItemMutation,
  useMakeupArtistsQuery,
  useMakeupInventoryQuery,
  useMakeupPackagesQuery,
  useUpdateMakeupInventoryItemMutation,
} from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";
import type { MakeupInventoryItemDto } from "@/types/makeupModule";

const COPY = {
  vi: {
    title: "Danh sách hàng makeup",
    subtitle: "Quản lý đồ dùng/phụ kiện/mỹ phẩm theo gói và chuyên viên.",
    loading: "Đang tải danh sách hàng makeup...",
    loadError: "Tải danh sách hàng makeup thất bại.",
    retryAction: "Thử lại",
    requiredFields: "Cần nhập tên món hàng, gói makeup và chuyên viên.",
    saveSuccess: "Đã lưu món hàng makeup.",
    updateSuccess: "Đã cập nhật món hàng makeup.",
    saveAction: "Lưu món hàng",
    updateAction: "Cập nhật món hàng",
    cancelEditAction: "Hủy sửa",
    editAction: "Sửa",
    activateAction: "Bật",
    deactivateAction: "Ẩn",
  },
  en: {
    title: "Makeup inventory",
    subtitle: "Manage makeup tools/accessories/cosmetics by package and artist.",
    loading: "Loading makeup inventory...",
    loadError: "Failed to load makeup inventory.",
    retryAction: "Retry",
    requiredFields: "Name, package and artist are required.",
    saveSuccess: "Inventory item saved.",
    updateSuccess: "Inventory item updated.",
    saveAction: "Save item",
    updateAction: "Update item",
    cancelEditAction: "Cancel edit",
    editAction: "Edit",
    activateAction: "Activate",
    deactivateAction: "Deactivate",
  },
} as const;

type InventoryStatusFilter = "all" | "active" | "inactive";

export function useMakeupInventoryPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canManage = role === "owner_admin" || role === "manager" || role === "staff";

  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>("all");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [packageId, setPackageId] = useState("");
  const [artistProfileId, setArtistProfileId] = useState("");
  const [shopeeUrl, setShopeeUrl] = useState("");
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);

  const packagesQuery = useMakeupPackagesQuery({
    branchId: currentBranchId,
    activeOnly: false,
  });
  const artistsQuery = useMakeupArtistsQuery(currentBranchId, canManage);
  const inventoryQuery = useMakeupInventoryQuery(
    {
      branchId: currentBranchId,
      packageId: packageFilter || null,
      artistProfileId: artistFilter || null,
      isActive:
        statusFilter === "all" ? null : statusFilter === "active" ? true : false,
      search: search.trim() || null,
    },
    canManage
  );

  const createMutation = useCreateMakeupInventoryItemMutation();
  const updateMutation = useUpdateMakeupInventoryItemMutation();
  const items = makeupStore.inventory?.items ?? [];

  useEffect(() => {
    if (packageId || packagesQuery.data?.items.length === 0) return;
    const first = packagesQuery.data?.items[0];
    if (first) setPackageId(first.id);
  }, [packageId, packagesQuery.data?.items]);

  useEffect(() => {
    if (artistProfileId || artistsQuery.data?.items.length === 0) return;
    const first = artistsQuery.data?.items[0];
    if (first) setArtistProfileId(first.profileId);
  }, [artistProfileId, artistsQuery.data?.items]);

  const resetForm = () => {
    setEditingItemId(null);
    setName("");
    setCategory("");
    setShopeeUrl("");
    setNote("");
    setIsActive(true);
  };

  const onEdit = (item: MakeupInventoryItemDto) => {
    setEditingItemId(item.id);
    setName(item.name);
    setCategory(item.category ?? "");
    setPackageId(item.packageId);
    setArtistProfileId(item.artistProfileId);
    setShopeeUrl(item.shopeeUrl ?? "");
    setNote(item.note ?? "");
    setIsActive(item.isActive);
  };

  const onSubmit = async () => {
    const trimmedName = name.trim();
    if (!currentBranchId || !trimmedName || !packageId || !artistProfileId) {
      toast.error(copy.requiredFields);
      return;
    }

    try {
      if (editingItemId) {
        await updateMutation.mutateAsync({
          itemId: editingItemId,
          payload: {
            name: trimmedName,
            category: category.trim() || null,
            packageId,
            artistProfileId,
            shopeeUrl: shopeeUrl.trim() || null,
            note: note.trim() || null,
            isActive,
          },
        });
        toast.success(copy.updateSuccess);
      } else {
        await createMutation.mutateAsync({
          branchId: currentBranchId,
          name: trimmedName,
          category: category.trim() || null,
          packageId,
          artistProfileId,
          shopeeUrl: shopeeUrl.trim() || null,
          note: note.trim() || null,
          isActive,
        });
        toast.success(copy.saveSuccess);
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const onToggleActive = async (item: MakeupInventoryItemDto) => {
    try {
      await updateMutation.mutateAsync({
        itemId: item.id,
        payload: { isActive: !item.isActive },
      });
      toast.success(copy.updateSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const packageOptions = useMemo(
    () => packagesQuery.data?.items ?? [],
    [packagesQuery.data?.items]
  );
  const artistOptions = useMemo(
    () => artistsQuery.data?.items ?? [],
    [artistsQuery.data?.items]
  );

  return {
    copy,
    canManage,
    inventoryQuery,
    packagesQuery,
    artistsQuery,
    createMutation,
    updateMutation,
    items,
    search,
    setSearch,
    packageFilter,
    setPackageFilter,
    artistFilter,
    setArtistFilter,
    statusFilter,
    setStatusFilter,
    editingItemId,
    name,
    setName,
    category,
    setCategory,
    packageId,
    setPackageId,
    artistProfileId,
    setArtistProfileId,
    shopeeUrl,
    setShopeeUrl,
    note,
    setNote,
    isActive,
    setIsActive,
    packageOptions,
    artistOptions,
    onEdit,
    onSubmit,
    onToggleActive,
    onCancelEdit: resetForm,
  };
}
