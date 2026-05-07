"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import { returnOrdersClientService } from "@/features/orders/services/returnOrdersClientService";
import { returnOrdersStore } from "@/features/orders/stores/returnOrdersStore";
import type {
  CreateReturnOrderPayload,
  ReturnOrderDetailDto,
  ReturnOrderSourcesQuery,
  SettleReturnOrderPayload,
  TransitionReturnOrderStatusPayload,
} from "@/types/returnOrdersDomain";

const returnOrdersQueryKeys = {
  all: ["return-orders"] as const,
  sources: () => [...returnOrdersQueryKeys.all, "sources"] as const,
  sourceList: (query: ReturnOrderSourcesQuery) =>
    [
      ...returnOrdersQueryKeys.sources(),
      query.branchId ?? "",
      query.search ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
  details: () => [...returnOrdersQueryKeys.all, "detail"] as const,
  detail: (returnOrderId: string) =>
    [...returnOrdersQueryKeys.details(), returnOrderId] as const,
};

function hydrateRelatedOrder(detail: ReturnOrderDetailDto) {
  ordersStore.hydrateDetail(detail.sourceOrder);
}

export function useReturnOrderSourcesQuery(query: ReturnOrderSourcesQuery) {
  const queryResult = useQuery({
    queryKey: returnOrdersQueryKeys.sourceList(query),
    queryFn: () => returnOrdersClientService.fetchSources(query),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    returnOrdersStore.hydrateSources(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useReturnOrderDetailQuery(returnOrderId: string) {
  const queryResult = useQuery({
    queryKey: returnOrdersQueryKeys.detail(returnOrderId),
    queryFn: () => returnOrdersClientService.fetchDetail(returnOrderId),
    enabled: Boolean(returnOrderId),
    staleTime: 8_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    returnOrdersStore.hydrateDetail(queryResult.data);
    hydrateRelatedOrder(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateReturnOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReturnOrderPayload) =>
      returnOrdersClientService.createReturnOrder(payload),
    onSuccess: async (detail) => {
      returnOrdersStore.hydrateDetail(detail);
      hydrateRelatedOrder(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: returnOrdersQueryKeys.sources() }),
        queryClient.invalidateQueries({ queryKey: returnOrdersQueryKeys.details() }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export function useTransitionReturnOrderStatusMutation(returnOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransitionReturnOrderStatusPayload) =>
      returnOrdersClientService.transitionStatus(returnOrderId, payload),
    onSuccess: async (detail) => {
      returnOrdersStore.hydrateDetail(detail);
      hydrateRelatedOrder(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: returnOrdersQueryKeys.detail(returnOrderId),
        }),
        queryClient.invalidateQueries({ queryKey: returnOrdersQueryKeys.sources() }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export function useSettleReturnOrderMutation(returnOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettleReturnOrderPayload) =>
      returnOrdersClientService.settleReturnOrder(returnOrderId, payload),
    onSuccess: async (detail) => {
      returnOrdersStore.hydrateDetail(detail);
      hydrateRelatedOrder(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: returnOrdersQueryKeys.detail(returnOrderId),
        }),
        queryClient.invalidateQueries({ queryKey: returnOrdersQueryKeys.sources() }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export function useCompleteReturnOrderMutation(returnOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => returnOrdersClientService.completeReturnOrder(returnOrderId),
    onSuccess: async (detail) => {
      returnOrdersStore.hydrateDetail(detail);
      hydrateRelatedOrder(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: returnOrdersQueryKeys.detail(returnOrderId),
        }),
        queryClient.invalidateQueries({ queryKey: returnOrdersQueryKeys.sources() }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export function useCancelReturnOrderMutation(returnOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string | null) =>
      returnOrdersClientService.cancelReturnOrder(returnOrderId, reason),
    onSuccess: async (detail) => {
      returnOrdersStore.hydrateDetail(detail);
      hydrateRelatedOrder(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: returnOrdersQueryKeys.detail(returnOrderId),
        }),
        queryClient.invalidateQueries({ queryKey: returnOrdersQueryKeys.sources() }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}
