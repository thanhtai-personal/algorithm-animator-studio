"use client";

import { useCallback, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { ITEM_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import {
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_INITIAL_ITEM_STATUS_VALUES,
  PRODUCTS_DEFAULT_PAGE_SIZE,
} from "@/features/products/constants";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsCountQuery,
  useProductsListQuery,
  useUpdateProductOverviewByIdMutation,
} from "@/features/products/queries/useProductsQueries";
import { productsClientService } from "@/features/products/services/productsClientService";
import { productsStore } from "@/features/products/stores/productsStore";
import type { ProductOverviewFormDraft } from "@/features/products/types/productOverviewForm";
import {
  generateSequentialItemCodes,
  parseNonNegativeIntegerInput,
} from "@/features/products/utils/itemBatch";
import { useDebouncedValue } from "@/features/products/utils/useDebouncedValue";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { buildDomainLabels } from "@/utils/domainLabels";
import type { ProductInitialItemStatus } from "@/types/productsCatalog";
import { GENDER_LABELS, PRODUCTS_LIST_COPY } from "./copy";
import {
  buildInitialCreateDraft,
  generateProductCode,
  normalizeInitialItemStatusForRole,
  parseMoneyField,
  parseMultilineValues,
  resolveCreateProductErrorMessage,
  resolveDeleteProductErrorMessage,
  uniqueValues,
} from "./utils";

export function useProductsListPage(locale: AppLocale) {
  const copy = PRODUCTS_LIST_COPY[locale];
  const { currentBranchId, can } = useAuthAccess();
  const canEditPricing = can("products.edit_pricing");
  const canDeleteProduct = can("settings.manage");

  const [searchInput, setSearchInput] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [hasReadyItems, setHasReadyItems] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<ProductOverviewFormDraft>(() =>
    buildInitialCreateDraft()
  );
  const [createItemQuantityInput, setCreateItemQuantityInput] = useState("1");
  const [createInitialItemStatus, setCreateInitialItemStatus] =
    useState<ProductInitialItemStatus>("READY");
  const [createItemSize, setCreateItemSize] = useState("m");

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const listQuery = useProductsListQuery({
    branchId: currentBranchId,
    search: debouncedSearch,
    productCategoryId: productCategoryId || null,
    tagId: tagId || null,
    hasReadyItems,
    page,
    pageSize: PRODUCTS_DEFAULT_PAGE_SIZE,
  });
  const productsCountQuery = useProductsCountQuery({
    branchId: currentBranchId,
  });

  const createMutation = useCreateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const updateProductOverviewByIdMutation = useUpdateProductOverviewByIdMutation();

  const totalPages = (() => {
    if (productsStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(productsStore.listTotal / productsStore.listPageSize));
  })();

  const listViewItems = productsStore.listItems.map((entry) => ({
    ...entry,
    coverImageUrl: productsClientService.resolveCoverImageUrl(entry.coverImagePath),
  }));

  const genderOptions = useMemo(
    () => PRODUCT_GENDER_OPTIONS.map((value) => ({ value, label: GENDER_LABELS[locale][value] })),
    [locale]
  );
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
    [locale]
  );
  const initialItemStatusOptions = useMemo(
    () =>
      PRODUCT_INITIAL_ITEM_STATUS_VALUES
        .filter((value) => canEditPricing || value !== "SOLD")
        .map((value) => ({
          value,
          label: itemStatusLabels[value],
        })),
    [canEditPricing, itemStatusLabels]
  );

  const parsedCreateItemQuantity = useMemo(
    () => parseNonNegativeIntegerInput(createItemQuantityInput),
    [createItemQuantityInput]
  );
  const createProductCodeForItems = useMemo(
    () => createDraft.productCode.trim().toUpperCase(),
    [createDraft.productCode]
  );
  const createGeneratedItemCodes = useMemo(() => {
    if (!createProductCodeForItems) return [];
    if (!parsedCreateItemQuantity || parsedCreateItemQuantity <= 0) return [];
    return generateSequentialItemCodes(createProductCodeForItems, parsedCreateItemQuantity);
  }, [createProductCodeForItems, parsedCreateItemQuantity]);

  const getNextProductIndex = useCallback(() => {
    const total = productsCountQuery.data ?? productsStore.listTotal;
    return Math.max(0, total) + 1;
  }, [productsCountQuery.data]);

  const resetCreateDraft = useCallback(() => {
    setCreateDraft(buildInitialCreateDraft(getNextProductIndex()));
    setCreateItemQuantityInput("1");
    setCreateInitialItemStatus("READY");
    setCreateItemSize("m");
  }, [getNextProductIndex]);

  const openCreatePanel = useCallback(() => {
    createMutation.reset();
    resetCreateDraft();
    setCreateOpen(true);
  }, [createMutation, resetCreateDraft]);

  const closeCreatePanel = useCallback(() => {
    setCreateOpen(false);
    resetCreateDraft();
  }, [resetCreateDraft]);

  const regenerateCreateProductCode = useCallback(() => {
    setCreateDraft((previous) => ({
      ...previous,
      productCode: generateProductCode(getNextProductIndex()),
    }));
  }, [getNextProductIndex]);

  const handleCreateProduct = async () => {
    const productCode = createDraft.productCode.trim().toUpperCase();
    const name = createDraft.name.trim();

    if (!productCode || !name) {
      throw new Error(locale === "vi" ? "Mã và tên sản phẩm là bắt buộc" : "Product code and name are required");
    }

    const coverImageUrl = createDraft.coverImageUrl.trim() || null;
    const galleryImagePaths = uniqueValues(parseMultilineValues(createDraft.galleryImageUrlsText));
    const videoUrls = uniqueValues(parseMultilineValues(createDraft.videoUrlsText));
    const rentPricePerDay = parseMoneyField(createDraft.rentPricePerDay, locale, {
      fieldName: copy.createFields.rentPricePerDay,
    });
    const rentDepositAmount = parseMoneyField(createDraft.rentDepositAmount, locale, {
      fieldName: copy.createFields.rentDepositAmount,
    });
    const quickRentPrice = parseMoneyField(createDraft.quickRentPrice, locale, {
      fieldName: copy.createFields.quickRentPrice,
    });
    const salePrice = parseMoneyField(createDraft.salePrice, locale, {
      fieldName: copy.createFields.salePrice,
    });
    const purchasePrice = canEditPricing
      ? parseMoneyField(createDraft.purchasePrice, locale, {
          fieldName: copy.createFields.purchasePrice,
        })
      : null;

    if (rentPricePerDay === null) {
      throw new Error(locale === "vi" ? "Giá thuê là bắt buộc." : "Rent price is required.");
    }
    const itemQuantity = parsedCreateItemQuantity;
    if (itemQuantity === null) {
      throw new Error(copy.createInvalidItemQuantityError);
    }
    if (itemQuantity > 0 && !productCode) {
      throw new Error(copy.createProductCodeRequiredForItemsError);
    }
    const generatedItemCodes = createGeneratedItemCodes;
    const initialItemStatus = normalizeInitialItemStatusForRole(
      createInitialItemStatus,
      canEditPricing
    );
    const itemSize = createItemSize.trim() || null;

    await createMutation.mutateAsync({
      branchId: currentBranchId,
      productCode,
      name,
      productCategoryId: createDraft.productCategoryId || null,
      gender: createDraft.gender || null,
      material: createDraft.material || null,
      description: createDraft.description || null,
      coverImagePath: coverImageUrl,
      galleryImagePaths,
      videoUrls,
      rentPricePerDay,
      quickRentPrice,
      rentDepositAmount,
      salePrice,
      purchasePrice,
      isRentable: createDraft.isRentable,
      isSaleable: createDraft.isSaleable,
      tagIds: createDraft.tagIds,
      isActive: createDraft.isActive,
      ...(generatedItemCodes.length > 0
        ? {
            items: generatedItemCodes.map((itemCode) => ({
              itemCode,
              initialStatus: initialItemStatus,
              size: itemSize,
            })),
          }
        : {}),
    }).catch((error: unknown) => {
      throw new Error(
        resolveCreateProductErrorMessage({
          error,
          copy,
          fallback: copy.createFailed,
        })
      );
    });

    closeCreatePanel();
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProductMutation.mutateAsync(productId).catch((error: unknown) => {
      throw new Error(
        resolveDeleteProductErrorMessage({
          error,
          copy,
          fallback: copy.deleteFailed,
        })
      );
    });
  };

  const handleQuickSetProductCover = async (
    productId: string,
    coverImagePath: string
  ) => {
    await updateProductOverviewByIdMutation
      .mutateAsync({
        productId,
        payload: {
          coverImagePath,
        },
      })
      .catch((error: unknown) => {
        throw new Error(
          resolveCreateProductErrorMessage({
            error,
            copy,
            fallback: copy.quickCoverFailed,
          })
        );
      });
  };

  return {
    copy,
    searchInput,
    setSearchInput: (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    productCategoryId,
    setProductCategoryId: (value: string) => {
      setProductCategoryId(value);
      setPage(1);
    },
    tagId,
    setTagId: (value: string) => {
      setTagId(value);
      setPage(1);
    },
    hasReadyItems,
    setHasReadyItems: (value: boolean) => {
      setHasReadyItems(value);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    listQuery,
    listItems: listViewItems,
    listTotal: productsStore.listTotal,
    categories: productsStore.categories,
    tags: productsStore.tags,
    createOpen,
    createDraft,
    setCreateDraft,
    createItemQuantityInput,
    setCreateItemQuantityInput,
    createGeneratedItemCodes,
    createInitialItemStatus,
    setCreateInitialItemStatus,
    createItemSize,
    setCreateItemSize,
    initialItemStatusOptions,
    openCreatePanel,
    closeCreatePanel,
    regenerateCreateProductCode,
    handleCreateProduct,
    handleDeleteProduct,
    handleQuickSetProductCover,
    resolveCreateErrorMessage: (error: unknown, fallback: string) =>
      resolveCreateProductErrorMessage({
        error,
        copy,
        fallback,
      }),
    resolveDeleteErrorMessage: (error: unknown, fallback: string) =>
      resolveDeleteProductErrorMessage({
        error,
        copy,
        fallback,
      }),
    createMutation,
    deleteProductMutation,
    updateProductOverviewByIdMutation,
    genderOptions,
    canEditPricing,
    canDeleteProduct,
    currentBranchId,
  };
}
