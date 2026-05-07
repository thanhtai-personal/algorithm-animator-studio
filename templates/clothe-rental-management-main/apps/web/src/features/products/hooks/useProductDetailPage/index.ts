"use client";

import { useMemo, useState, type SetStateAction } from "react";
import type { AppLocale } from "@/constants/locale";
import { ITEM_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import {
  PRODUCT_DETAIL_TABS,
  type ProductDetailTabKey,
  PRODUCT_GENDER_OPTIONS,
} from "@/features/products/constants";
import {
  useAddProductItemsMutation,
  useDeleteProductItemMutation,
  useProductDetailQuery,
  useUpdateProductItemMutation,
  useUpdateProductOverviewMutation,
} from "@/features/products/queries/useProductsQueries";
import { productsStore } from "@/features/products/stores/productsStore";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { buildDomainLabels } from "@/utils/domainLabels";
import { validateNonNegativeMoneyInput } from "@/utils/validation/money";
import type { ProductDetailDto } from "@/types/productsCatalog";
import { GENDER_LABELS, PRODUCT_DETAIL_COPY } from "./copy";
import {
  createOverviewDraftFromDetail,
  generateAutoItemCodes,
  parseMultilineValues,
  parsePositiveInteger,
  resolveProductDetailActionErrorMessage,
  uniqueValues,
  type OverviewDraft,
} from "./utils";

export function useProductDetailPage(locale: AppLocale, productId: string) {
  const copy = PRODUCT_DETAIL_COPY[locale];
  const [activeTab, setActiveTab] = useState<ProductDetailTabKey>(PRODUCT_DETAIL_TABS[0]);
  const [addItemsQuantity, setAddItemsQuantity] = useState("1");
  const [addItemsSize, setAddItemsSize] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemCode, setEditingItemCode] = useState("");
  const [editingItemSize, setEditingItemSize] = useState("");
  const { can } = useAuthAccess();

  const detailQuery = useProductDetailQuery(productId);
  const updateOverviewMutation = useUpdateProductOverviewMutation(productId);
  const addItemsMutation = useAddProductItemsMutation(productId);
  const updateItemMutation = useUpdateProductItemMutation(productId);
  const deleteItemMutation = useDeleteProductItemMutation(productId);

  const detail = productsStore.getDetailByProductId(productId);

  const [overviewDraftState, setOverviewDraftState] = useState<OverviewDraft | null>(null);

  const overviewDraft = useMemo(() => {
    if (overviewDraftState) return overviewDraftState;
    if (!detail) return null;
    return createOverviewDraftFromDetail(detail);
  }, [detail, overviewDraftState]);

  const setOverviewDraft = (updater: SetStateAction<OverviewDraft>) => {
    setOverviewDraftState((previous) => {
      const base = previous ?? (detail ? createOverviewDraftFromDetail(detail) : null);
      if (!base) return null;
      return typeof updater === "function"
        ? (updater as (value: OverviewDraft) => OverviewDraft)(base)
        : updater;
    });
  };

  const canEditPricing = can("products.edit_pricing");

  const parseMoneyField = (raw: string): number | null => {
    const result = validateNonNegativeMoneyInput(raw, { allowEmpty: true });
    if (!result.isValid) {
      throw new Error(
        locale === "vi"
          ? "Giá trị tiền không hợp lệ hoặc nhỏ hơn 0"
          : "Money value is invalid or below zero"
      );
    }
    return result.value;
  };

  const genderOptions = useMemo(
    () => PRODUCT_GENDER_OPTIONS.map((value) => ({ value, label: GENDER_LABELS[locale][value] })),
    [locale]
  );
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
    [locale]
  );

  const saveOverview = async () => {
    if (!overviewDraft) return;

    const productCode = overviewDraft.productCode.trim().toUpperCase();
    const currentProductCode = detail?.overview.productCode.trim().toUpperCase() ?? "";
    const coverImageUrl = overviewDraft.coverImageUrl.trim() || null;
    const galleryImagePaths = uniqueValues(parseMultilineValues(overviewDraft.galleryImageUrlsText));
    const videoUrls = uniqueValues(parseMultilineValues(overviewDraft.videoUrlsText));

    const payload = {
      ...(productCode !== currentProductCode
        ? {
            productCode,
          }
        : {}),
      name: overviewDraft.name,
      productCategoryId: overviewDraft.productCategoryId || null,
      gender: overviewDraft.gender || null,
      material: overviewDraft.material || null,
      description: overviewDraft.description || null,
      coverImagePath: coverImageUrl,
      galleryImagePaths,
      videoUrls,
      rentPricePerDay: parseMoneyField(overviewDraft.rentPricePerDay),
      quickRentPrice: parseMoneyField(overviewDraft.quickRentPrice),
      rentDepositAmount: parseMoneyField(overviewDraft.rentDepositAmount),
      salePrice: parseMoneyField(overviewDraft.salePrice),
      isRentable: overviewDraft.isRentable,
      isSaleable: overviewDraft.isSaleable,
      tagIds: overviewDraft.tagIds,
      isActive: overviewDraft.isActive,
      ...(canEditPricing
        ? {
            purchasePrice: parseMoneyField(overviewDraft.purchasePrice),
          }
        : {}),
    };

    await updateOverviewMutation.mutateAsync(payload);
    setOverviewDraftState(null);
  };

  const addItemsToProduct = async () => {
    const parsedQuantity = parsePositiveInteger(addItemsQuantity);
    if (!parsedQuantity) {
      throw new Error(copy.addItemsQuantityError);
    }

    const productCode = detail?.overview.productCode?.trim() ?? "";
    if (!productCode) {
      throw new Error(copy.addItemsMissingProductCodeError);
    }

    const generatedItemCodes = generateAutoItemCodes({
      productCode,
      existingItemCodes: detail?.items.map((item) => item.itemCode) ?? [],
      quantity: parsedQuantity,
    });
    const normalizedSize = addItemsSize.trim() || null;

    await addItemsMutation.mutateAsync({
      items: generatedItemCodes.map((itemCode) => ({
        itemCode,
        initialStatus: "READY",
        size: normalizedSize,
      })),
    });
    await detailQuery.refetch();

    setAddItemsQuantity("1");
    setAddItemsSize("");
  };

  const startEditingItem = (item: ProductDetailDto["items"][number]) => {
    setEditingItemId(item.id);
    setEditingItemCode(item.itemCode);
    setEditingItemSize(item.size ?? "");
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingItemCode("");
    setEditingItemSize("");
  };

  const saveEditedItem = async () => {
    if (!editingItemId) return;

    const itemCode = editingItemCode.trim();
    if (!itemCode) {
      throw new Error(copy.editItemRequiredCodeError);
    }

    await updateItemMutation.mutateAsync({
      itemId: editingItemId,
      payload: {
        itemCode,
        size: editingItemSize.trim() || null,
      },
    });
    await detailQuery.refetch();
    cancelEditingItem();
  };

  const deleteItem = async (itemId: string) => {
    await deleteItemMutation.mutateAsync({ itemId });
    await detailQuery.refetch();

    if (editingItemId === itemId) {
      cancelEditingItem();
    }
  };

  const resolveActionErrorMessage = (error: unknown, fallback: string) =>
    resolveProductDetailActionErrorMessage({
      error,
      copy,
      fallback,
    });

  return {
    copy,
    detail,
    detailQuery,
    activeTab,
    setActiveTab,
    overviewDraft,
    setOverviewDraft,
    canEditPricing,
    saveOverview,
    updateOverviewMutation,
    addItemsQuantity,
    setAddItemsQuantity,
    addItemsSize,
    setAddItemsSize,
    itemStatusLabels,
    addItemsToProduct,
    addItemsMutation,
    editingItemId,
    editingItemCode,
    setEditingItemCode,
    editingItemSize,
    setEditingItemSize,
    startEditingItem,
    cancelEditingItem,
    saveEditedItem,
    updateItemMutation,
    deleteItem,
    deleteItemMutation,
    resolveActionErrorMessage,
    genderOptions,
    tabs: PRODUCT_DETAIL_TABS,
  };
}
