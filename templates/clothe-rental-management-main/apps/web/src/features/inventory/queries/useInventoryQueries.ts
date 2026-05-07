"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryClientService } from "@/features/inventory/services/inventoryClientService";
import { inventoryStore } from "@/features/inventory/stores/inventoryStore";
import type {
  BulkUpdateInventoryItemStatusPayload,
  InventoryAddProductItemsPayload,
  InventoryListQuery,
  InventoryProductOptionsQuery,
  UpdateInventoryItemStatusPayload,
} from "@/types/inventoryItems";

const inventoryQueryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryQueryKeys.all, "list"] as const,
  list: (query: InventoryListQuery) =>
    [
      ...inventoryQueryKeys.lists(),
      query.viewMode ?? "items",
      query.branchId ?? "",
      query.status ?? "",
      query.productCategoryId ?? "",
      query.size ?? "",
      query.search ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
  details: () => [...inventoryQueryKeys.all, "detail"] as const,
  detail: (itemId: string) => [...inventoryQueryKeys.details(), itemId] as const,
  scans: () => [...inventoryQueryKeys.all, "scan"] as const,
  productOptions: (query: InventoryProductOptionsQuery) =>
    [
      ...inventoryQueryKeys.all,
      "product-options",
      query.branchId ?? "",
      query.search ?? "",
      query.pageSize ?? 60,
    ] as const,
};

export function useInventoryListQuery(
  query: InventoryListQuery,
  options?: { enabled?: boolean }
) {
  const queryResult = useQuery({
    queryKey: inventoryQueryKeys.list(query),
    queryFn: () => inventoryClientService.fetchInventoryItems(query),
    enabled: options?.enabled ?? true,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    inventoryStore.hydrateList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useInventoryProductListQuery(options: {
  query: InventoryListQuery;
  enabled?: boolean;
}) {
  const queryResult = useQuery({
    queryKey: inventoryQueryKeys.list({
      ...options.query,
      viewMode: "products",
    }),
    queryFn: () => inventoryClientService.fetchInventoryProducts(options.query),
    enabled: options.enabled ?? true,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    inventoryStore.hydrateProductList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useInventoryItemDetailQuery(itemId: string) {
  const queryResult = useQuery({
    queryKey: inventoryQueryKeys.detail(itemId),
    queryFn: () => inventoryClientService.fetchInventoryItemDetail(itemId),
    enabled: Boolean(itemId),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    inventoryStore.hydrateDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useUpdateInventoryItemStatusMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInventoryItemStatusPayload) =>
      inventoryClientService.updateInventoryItemStatus(itemId, payload),
    onSuccess: async (detail) => {
      inventoryStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.detail(itemId) }),
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateInventoryItemStatusAnyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateInventoryItemStatusPayload;
    }) => inventoryClientService.updateInventoryItemStatus(itemId, payload),
    onSuccess: async (detail) => {
      inventoryStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.detail(detail.item.id) }),
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lists() }),
      ]);
    },
  });
}

export function useBulkUpdateInventoryItemStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateInventoryItemStatusPayload) =>
      inventoryClientService.bulkUpdateInventoryItemStatus(payload),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lists() }),
        ...result.succeededItemIds.map((itemId) =>
          queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.detail(itemId) })
        ),
      ]);
    },
  });
}

export function useInventoryProductOptionsQuery(options: {
  query: InventoryProductOptionsQuery;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: inventoryQueryKeys.productOptions(options.query),
    queryFn: () => inventoryClientService.fetchInventoryProductOptions(options.query),
    enabled: options.enabled ?? true,
    staleTime: 20_000,
  });
}

export function useCreateInventoryProductItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InventoryAddProductItemsPayload) =>
      inventoryClientService.addInventoryProductItems(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lists() });
    },
  });
}

export function useScanInventoryItemMutation() {
  return useMutation({
    mutationFn: ({ code, branchId }: { code: string; branchId?: string | null }) =>
      inventoryClientService.scanInventoryItem({ code, branchId }),
  });
}

export { inventoryQueryKeys };
