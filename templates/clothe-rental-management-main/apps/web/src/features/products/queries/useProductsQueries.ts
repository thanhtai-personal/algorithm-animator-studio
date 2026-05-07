"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsStore } from "@/features/products/stores/productsStore";
import { productsClientService } from "@/features/products/services/productsClientService";
import type {
  AddProductItemsRequestPayload,
  CreateProductPayload,
  ProductsListQuery,
  UpdateProductItemPayload,
  UpdateProductOverviewPayload,
  UpdateProductPricingPayload,
} from "@/types/productsCatalog";

const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "list"] as const,
  count: (query: Pick<ProductsListQuery, "branchId">) =>
    [...productsQueryKeys.lists(), "count", query.branchId ?? ""] as const,
  list: (query: ProductsListQuery) =>
    [
      ...productsQueryKeys.lists(),
      query.branchId ?? "",
      query.search ?? "",
      query.productCategoryId ?? "",
      query.tagId ?? "",
      query.hasReadyItems ? "1" : "0",
      query.page ?? 1,
      query.pageSize ?? 12,
    ] as const,
  details: () => [...productsQueryKeys.all, "detail"] as const,
  detail: (productId: string) => [...productsQueryKeys.details(), productId] as const,
};

export function useProductsListQuery(
  query: ProductsListQuery,
  options?: { enabled?: boolean }
) {
  const queryResult = useQuery({
    queryKey: productsQueryKeys.list(query),
    queryFn: () => productsClientService.fetchProducts(query),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    productsStore.hydrateList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useProductsCountQuery(query: Pick<ProductsListQuery, "branchId">) {
  return useQuery({
    queryKey: productsQueryKeys.count(query),
    queryFn: () =>
      productsClientService.fetchProducts({
        branchId: query.branchId,
        page: 1,
        pageSize: 1,
      }),
    enabled: Boolean(query.branchId),
    staleTime: 30_000,
    select: (payload) => payload.total,
  });
}

export function useProductDetailQuery(productId: string) {
  const queryResult = useQuery({
    queryKey: productsQueryKeys.detail(productId),
    queryFn: () => productsClientService.fetchProductDetail(productId),
    enabled: Boolean(productId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    productsStore.hydrateDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productsClientService.createProduct(payload),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => productsClientService.deleteProduct(productId),
    onSuccess: async (_payload, productId) => {
      productsStore.removeProductById(productId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateProductOverviewMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductOverviewPayload) =>
      productsClientService.updateProductOverview(productId, payload),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateProductOverviewByIdMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductOverviewPayload;
    }) => productsClientService.updateProductOverview(productId, payload),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(detail.overview.id) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdatePricingMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductPricingPayload) =>
      productsClientService.updatePricing(productId, payload),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useAddProductItemsMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddProductItemsRequestPayload) =>
      productsClientService.addProductItems(productId, payload),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateProductItemMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateProductItemPayload;
    }) => productsClientService.updateProductItem(productId, itemId, payload),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useDeleteProductItemMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      productsClientService.deleteProductItem(productId, itemId),
    onSuccess: async (detail) => {
      productsStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(productId) }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUploadProductCoverMutation() {
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      productsClientService.uploadProductCover(productId, file),
  });
}

export { productsQueryKeys };
