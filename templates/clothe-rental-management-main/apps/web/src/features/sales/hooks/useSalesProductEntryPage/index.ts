"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ITEM_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateSalesProductEntryMutation,
  useSalesProductsCatalogQuery,
} from "@/features/sales/queries/useSalesQueries";
import { salesStore } from "@/features/sales/stores/salesStore";
import {
  generateSequentialItemCodes,
  parseNonNegativeIntegerInput,
} from "@/features/products/utils/itemBatch";
import { buildDomainLabels } from "@/utils/domainLabels";
import type {
  CreateSalesProductEntryPayload,
} from "@/types/salesProductEntry";
import {
  EMPTY_CATEGORIES,
  EMPTY_PRODUCTS,
  EMPTY_TAGS,
  INITIAL_DRAFT,
  SENSITIVE_PRICING_ROLE_SET,
} from "./constants";
import { GENDER_LABELS, SALES_ENTRY_COPY } from "./copy";
import type { FieldErrors, SalesProductEntryCopy, SalesProductEntryDraft } from "./types";
import {
  buildDraftStorageKey,
  normalizeInitialItemStatusForRole,
  parseMoneyInput,
  parseMultilineValues,
  parseStoredDraft,
  resolveSubmitErrorMessage,
  uniqueValues,
} from "./utils";

export function useSalesProductEntryPage(locale: AppLocale) {
  const copy = SALES_ENTRY_COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canEditSensitivePricing = SENSITIVE_PRICING_ROLE_SET.has(
    (role ?? "").toLowerCase()
  );

  const [draft, setDraft] = useState<SalesProductEntryDraft>(() => {
    if (typeof window === "undefined") return INITIAL_DRAFT;
    const parsed = parseStoredDraft(
      window.sessionStorage.getItem(buildDraftStorageKey(currentBranchId))
    );
    if (!parsed) return INITIAL_DRAFT;
    return {
      ...INITIAL_DRAFT,
      ...parsed,
      tagIds: Array.isArray(parsed.tagIds)
        ? parsed.tagIds.filter((entry): entry is string => typeof entry === "string")
        : INITIAL_DRAFT.tagIds,
      initialItemStatus: normalizeInitialItemStatusForRole(
        parsed.initialItemStatus ?? INITIAL_DRAFT.initialItemStatus,
        canEditSensitivePricing
      ),
    };
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const storageKey = useMemo(
    () => buildDraftStorageKey(currentBranchId),
    [currentBranchId]
  );

  const catalogQuery = useSalesProductsCatalogQuery({
    branchId: currentBranchId,
    page: 1,
    pageSize: 24,
  });

  const createMutation = useCreateSalesProductEntryMutation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  const categories = salesStore.productEntryCatalog?.categories ?? EMPTY_CATEGORIES;
  const tags = salesStore.productEntryCatalog?.tags ?? EMPTY_TAGS;
  const recentProducts = salesStore.productEntryCatalog?.items ?? EMPTY_PRODUCTS;
  const lastCreatedProduct = salesStore.lastCreatedProductDetail;
  const parsedItemQuantity = useMemo(
    () => parseNonNegativeIntegerInput(draft.itemQuantityInput),
    [draft.itemQuantityInput]
  );
  const productCodeForItems = useMemo(
    () => draft.productCode.trim().toUpperCase(),
    [draft.productCode]
  );
  const generatedItemCodes = useMemo(() => {
    if (!productCodeForItems) return [];
    if (!parsedItemQuantity || parsedItemQuantity <= 0) return [];
    return generateSequentialItemCodes(productCodeForItems, parsedItemQuantity);
  }, [parsedItemQuantity, productCodeForItems]);

  const summary = useMemo(
    () => ({
      itemCount: generatedItemCodes.length,
      categoryName: categories.find((entry) => entry.id === draft.productCategoryId)?.name ?? "-",
      tagNames: tags
        .filter((entry) => draft.tagIds.includes(entry.id))
        .map((entry) => entry.name),
    }),
    [categories, draft.productCategoryId, draft.tagIds, generatedItemCodes.length, tags]
  );
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
    [locale]
  );
  const genderOptions = useMemo(
    () =>
      (["female", "male", "unisex", "other"] as const).map((value) => ({
        value,
        label: GENDER_LABELS[locale][value],
      })),
    [locale]
  );
  const itemStatusOptions = useMemo(
    () =>
      copy.itemStatusOptions.filter(
        (option) => canEditSensitivePricing || option.value !== "SOLD"
      ).map((option) => ({
        ...option,
        label: itemStatusLabels[option.value] ?? option.label,
      })),
    [canEditSensitivePricing, copy.itemStatusOptions, itemStatusLabels]
  );
  const viewCopy = useMemo<SalesProductEntryCopy>(
    () => ({
      ...copy,
      itemStatusOptions,
    }),
    [copy, itemStatusOptions]
  );

  const setDraftField = useCallback(
    <K extends keyof SalesProductEntryDraft>(field: K, value: SalesProductEntryDraft[K]) => {
      setDraft((previous) => ({
        ...previous,
        [field]: value,
      }));
      setFieldErrors((previous) => {
        if (!previous[field as string]) return previous;
        const next = { ...previous };
        delete next[field as string];
        return next;
      });
    },
    []
  );

  const toggleTag = useCallback((tagId: string) => {
    setDraft((previous) => {
      if (previous.tagIds.includes(tagId)) {
        return {
          ...previous,
          tagIds: previous.tagIds.filter((entry) => entry !== tagId),
        };
      }

      return {
        ...previous,
        tagIds: [...previous.tagIds, tagId],
      };
    });
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setFieldErrors({});
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const buildPayload = useCallback((): {
    payload: CreateSalesProductEntryPayload | null;
    errors: FieldErrors;
  } => {
    const errors: FieldErrors = {};

    if (!currentBranchId) {
      errors.branchId = copy.branchMissing;
    }

    const productCode = draft.productCode.trim();
    if (!productCode) errors.productCode = copy.requiredError;

    const productName = draft.productName.trim();
    if (!productName) errors.productName = copy.requiredError;

    const price1d = parseMoneyInput(draft.price1dInput);
    if (price1d === null || price1d === "invalid") {
      errors.price1dInput = copy.invalidMoneyError;
    }

    const salePrice = parseMoneyInput(draft.salePriceInput);
    if (salePrice === "invalid") {
      errors.salePriceInput = copy.invalidMoneyError;
    }

    const purchasePrice = parseMoneyInput(draft.purchasePriceInput);
    if (!canEditSensitivePricing && purchasePrice !== null) {
      errors.purchasePriceInput = copy.purchasePricePermissionError;
    } else if (purchasePrice === "invalid") {
      errors.purchasePriceInput = copy.invalidMoneyError;
    }

    const defaultDepositAmount = parseMoneyInput(draft.defaultDepositInput);
    if (defaultDepositAmount === "invalid") {
      errors.defaultDepositInput = copy.invalidMoneyError;
    }

    const price3d = parseMoneyInput(draft.price3dInput);
    if (price3d === "invalid") {
      errors.price3dInput = copy.invalidMoneyError;
    }

    const price7d = parseMoneyInput(draft.price7dInput);
    if (price7d === "invalid") {
      errors.price7dInput = copy.invalidMoneyError;
    }

    const pricePerDay = parseMoneyInput(draft.pricePerDayInput);
    if (pricePerDay === "invalid") {
      errors.pricePerDayInput = copy.invalidMoneyError;
    }
    const itemQuantity = parsedItemQuantity;
    if (itemQuantity === null) {
      errors.itemQuantityInput = copy.invalidItemQuantityError;
    }
    if ((itemQuantity ?? 0) > 0 && !productCode) {
      errors.productCode = copy.productCodeRequiredForItemsError;
    }

    const hasErrors = Object.keys(errors).length > 0;
    if (
      hasErrors ||
      price1d === null ||
      price1d === "invalid" ||
      salePrice === "invalid" ||
      purchasePrice === "invalid" ||
      !currentBranchId
    ) {
      return {
        payload: null,
        errors,
      };
    }

    const normalizedDefaultDeposit: number | null =
      defaultDepositAmount === "invalid" ? null : defaultDepositAmount;
    const normalizedPrice3d: number | null = price3d === "invalid" ? null : price3d;
    const normalizedPrice7d: number | null = price7d === "invalid" ? null : price7d;
    const normalizedPricePerDay: number | null =
      pricePerDay === "invalid" ? null : pricePerDay;
    const normalizedSalePrice: number | null = salePrice;
    const normalizedPurchasePrice: number | null = purchasePrice;
    const coverImagePath = draft.coverImageUrl.trim() || null;
    const galleryImagePaths = uniqueValues(parseMultilineValues(draft.galleryImageUrlsText));
    const videoUrls = uniqueValues(parseMultilineValues(draft.videoUrlsText));
    const itemCodes = generatedItemCodes;
    const normalizedInitialStatus = normalizeInitialItemStatusForRole(
      draft.initialItemStatus,
      canEditSensitivePricing
    );
    const normalizedItemSize = draft.itemSize.trim() || null;

    return {
      payload: {
        branchId: currentBranchId,
        product: {
          productCode,
          name: productName,
          productCategoryId: draft.productCategoryId || null,
          gender: draft.gender || null,
          material: draft.material.trim() || null,
          description: draft.description.trim() || null,
          coverImagePath,
          galleryImagePaths,
          videoUrls,
          ...(canEditSensitivePricing ? { rentDepositAmount: normalizedDefaultDeposit } : {}),
          salePrice: normalizedSalePrice,
          purchasePrice: canEditSensitivePricing ? normalizedPurchasePrice : null,
          tagIds: draft.tagIds,
          isActive: draft.isActive,
          isRentable: draft.isRentable,
          isSaleable: draft.isSaleable,
        },
        pricing: {
          price1d,
          defaultDepositAmount: canEditSensitivePricing
            ? normalizedDefaultDeposit
            : null,
          price3d: canEditSensitivePricing ? normalizedPrice3d : null,
          price7d: canEditSensitivePricing ? normalizedPrice7d : null,
          pricePerDay: canEditSensitivePricing
            ? normalizedPricePerDay
            : null,
        },
        items: itemCodes.map((itemCode) => ({
          itemCode,
          initialStatus: normalizedInitialStatus,
          size: normalizedItemSize,
        })),
      },
      errors,
    };
  }, [
    canEditSensitivePricing,
    copy.branchMissing,
    copy.invalidItemQuantityError,
    copy.invalidMoneyError,
    copy.purchasePricePermissionError,
    copy.productCodeRequiredForItemsError,
    copy.requiredError,
    currentBranchId,
    draft,
    generatedItemCodes,
    parsedItemQuantity,
  ]);

  const handleSubmit = useCallback(async () => {
    const prepared = buildPayload();
    if (!prepared.payload) {
      setFieldErrors(prepared.errors);
      toast.error(copy.createFailed);
      return;
    }

    setFieldErrors({});

    try {
      await createMutation.mutateAsync(prepared.payload);
      toast.success(copy.createSuccess);
      resetDraft();
    } catch (error) {
      const message = resolveSubmitErrorMessage(error, copy.createFailed, locale);
      toast.error(message);
    }
  }, [
    buildPayload,
    copy.createFailed,
    copy.createSuccess,
    createMutation,
    locale,
    resetDraft,
  ]);

  return {
    copy: viewCopy,
    role,
    canEditSensitivePricing,
    categories,
    tags,
    recentProducts,
    lastCreatedProduct,
    draft,
    fieldErrors,
    generatedItemCodes,
    summary,
    genderOptions,
    isLoading: catalogQuery.isLoading,
    isSubmitting: createMutation.isPending,
    setDraftField,
    toggleTag,
    resetDraft,
    handleSubmit,
  };
}
