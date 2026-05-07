"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryQueryKeys } from "@/features/inventory/queries/useInventoryQueries";
import { productsQueryKeys } from "@/features/products/queries/useProductsQueries";
import { productsStore } from "@/features/products/stores/productsStore";
import { salesClientService } from "@/features/sales/services/salesClientService";
import { salesStore } from "@/features/sales/stores/salesStore";
import type {
  CloseSalesShiftPayload,
  OpenSalesShiftPayload,
} from "@/types/salesDesk";
import type {
  CreateSalesProductEntryPayload,
  SalesProductsCatalogQuery,
  UpdateSalesProductEntryPayload,
} from "@/types/salesProductEntry";
import type { CreatePosManualPaymentPayload } from "@/types/paymentsDomain";
import type { PosPasskeyVerifyPayload } from "@/types/settingsModule";

const salesQueryKeys = {
  all: ["sales"] as const,
  shifts: () => [...salesQueryKeys.all, "shift"] as const,
  currentShift: (branchId?: string | null) =>
    [...salesQueryKeys.shifts(), "current", branchId ?? ""] as const,
  currentShiftDetail: (branchId?: string | null) =>
    [...salesQueryKeys.shifts(), "current-detail", branchId ?? ""] as const,
  posPasskeyPolicy: () => [...salesQueryKeys.shifts(), "pos-passkey-policy"] as const,
  products: () => [...salesQueryKeys.all, "products"] as const,
  productsList: (query: SalesProductsCatalogQuery) =>
    [
      ...salesQueryKeys.products(),
      query.branchId ?? "",
      query.search ?? "",
      query.productCategoryId ?? "",
      query.tagId ?? "",
      query.hasReadyItems ? "1" : "0",
      query.page ?? 1,
      query.pageSize ?? 24,
    ] as const,
  productDetails: () => [...salesQueryKeys.products(), "detail"] as const,
  productDetail: (productId: string, branchId?: string | null) =>
    [...salesQueryKeys.productDetails(), productId, branchId ?? ""] as const,
};

export function useCurrentSalesShiftQuery(branchId?: string | null) {
  const queryResult = useQuery({
    queryKey: salesQueryKeys.currentShift(branchId),
    queryFn: () => salesClientService.fetchCurrentShift(branchId),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    salesStore.hydrateCurrentShift(queryResult.data.shift);
  }, [queryResult.data]);

  return queryResult;
}

export function useCurrentSalesShiftDetailQuery(
  branchId?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: salesQueryKeys.currentShiftDetail(branchId),
    queryFn: () => salesClientService.fetchCurrentShiftDetail(branchId),
    enabled,
    staleTime: 10_000,
  });
}

export function useOpenSalesShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenSalesShiftPayload) => salesClientService.openShift(payload),
    onSuccess: async (payload) => {
      salesStore.hydrateCurrentShift(payload.shift);
      await queryClient.invalidateQueries({ queryKey: salesQueryKeys.shifts() });
    },
  });
}

export function useCloseSalesShiftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CloseSalesShiftPayload) =>
      salesClientService.closeShift(payload),
    onSuccess: async () => {
      salesStore.hydrateCurrentShift(null);
      await queryClient.invalidateQueries({ queryKey: salesQueryKeys.shifts() });
    },
  });
}

export function useSalesPosPasskeyPolicyQuery() {
  return useQuery({
    queryKey: salesQueryKeys.posPasskeyPolicy(),
    queryFn: () => salesClientService.fetchPosPasskeyPolicy(),
    staleTime: 20_000,
  });
}

export function useVerifySalesPosPasskeyMutation() {
  return useMutation({
    mutationFn: (payload: PosPasskeyVerifyPayload) =>
      salesClientService.verifyPosPasskey(payload),
  });
}

export function useCreateSalesPosManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePosManualPaymentPayload) =>
      salesClientService.createPosManualPayment(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]);
    },
  });
}

export function useSalesProductsCatalogQuery(query: SalesProductsCatalogQuery) {
  const queryResult = useQuery({
    queryKey: salesQueryKeys.productsList(query),
    queryFn: () => salesClientService.fetchSalesProducts(query),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    salesStore.hydrateProductEntryCatalog(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useSalesProductDetailQuery(productId: string, branchId?: string | null) {
  const queryResult = useQuery({
    queryKey: salesQueryKeys.productDetail(productId, branchId),
    queryFn: () => salesClientService.fetchSalesProductDetail(productId, branchId),
    enabled: Boolean(productId),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    salesStore.hydrateLastCreatedProductDetail(queryResult.data);
    productsStore.hydrateDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateSalesProductEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSalesProductEntryPayload) =>
      salesClientService.createSalesProductEntry(payload),
    onSuccess: async (detail) => {
      salesStore.hydrateLastCreatedProductDetail(detail);
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: salesQueryKeys.productDetails() }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.details() }),
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateSalesProductMutation(productId: string, branchId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSalesProductEntryPayload) =>
      salesClientService.updateSalesProduct(productId, {
        ...payload,
        branchId,
      }),
    onSuccess: async (detail) => {
      salesStore.hydrateLastCreatedProductDetail(detail);
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesQueryKeys.productDetail(productId, branchId) }),
        queryClient.invalidateQueries({ queryKey: salesQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateSalesProductAnyMutation(branchId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateSalesProductEntryPayload;
    }) =>
      salesClientService.updateSalesProduct(productId, {
        ...payload,
        branchId,
      }),
    onSuccess: async (detail) => {
      salesStore.hydrateLastCreatedProductDetail(detail);
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: salesQueryKeys.productDetails() }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(detail.overview.id) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUploadSalesProductCoverMutation() {
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      salesClientService.uploadSalesProductCover(productId, file),
  });
}

export { salesQueryKeys };
