"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryQueryKeys } from "@/features/inventory/queries/useInventoryQueries";
import { ordersClientService } from "@/features/orders/services/ordersClientService";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import { productsQueryKeys } from "@/features/products/queries/useProductsQueries";
import type {
  AddOrderPaymentPayload,
  AddOrderItemPayload,
  CreateOrderIncidentPayload,
  CreateOrderPayload,
  OrderCancelPayload,
  OrdersListQuery,
  PickupOrderPayload,
  ProcessOrderReturnPayload,
  OrderStatusTransitionPayload,
  UpdateOrderPaymentStatusPayload,
  UpdateOrderItemPricingPayload,
  UpdateOrderPayload,
} from "@/types/ordersDomain";

const ordersQueryKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersQueryKeys.all, "list"] as const,
  list: (query: OrdersListQuery) =>
    [
      ...ordersQueryKeys.lists(),
      query.branchId ?? "",
      (query.orderTypes ?? []).join(","),
      (query.statuses ?? []).join(","),
      query.startDate ?? "",
      query.endDate ?? "",
      query.search ?? "",
      query.staffId ?? "",
      query.paymentStatus ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
  details: () => [...ordersQueryKeys.all, "detail"] as const,
  detail: (orderId: string) => [...ordersQueryKeys.details(), orderId] as const,
  availabilities: () => [...ordersQueryKeys.all, "availability"] as const,
  availability: (query: {
    branchId?: string | null;
    itemIds: string[];
    startDate: string;
    endDate: string;
    excludeOrderId?: string | null;
  }) =>
    [
      ...ordersQueryKeys.availabilities(),
      query.branchId ?? "",
      query.itemIds.join(","),
      query.startDate,
      query.endDate,
      query.excludeOrderId ?? "",
    ] as const,
};

export function useOrdersListQuery(query: OrdersListQuery) {
  const queryResult = useQuery({
    queryKey: ordersQueryKeys.list(query),
    queryFn: () => ordersClientService.fetchOrders(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    ordersStore.hydrateList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useOrderDetailQuery(orderId: string) {
  const queryResult = useQuery({
    queryKey: ordersQueryKeys.detail(orderId),
    queryFn: () => ordersClientService.fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    ordersStore.hydrateDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useOrderAvailabilityQuery(query: {
  branchId?: string | null;
  itemIds: string[];
  startDate: string;
  endDate: string;
  excludeOrderId?: string | null;
}, options?: { enabled?: boolean }) {
  const normalizedItemIds = query.itemIds.filter(Boolean);

  const queryResult = useQuery({
    queryKey: ordersQueryKeys.availability({
      ...query,
      itemIds: normalizedItemIds,
    }),
    queryFn: () =>
      ordersClientService.checkAvailability({
        ...query,
        itemIds: normalizedItemIds,
      }),
    enabled:
      (options?.enabled ?? true) &&
      normalizedItemIds.length > 0 &&
      Boolean(query.startDate) &&
      Boolean(query.endDate),
    staleTime: 8_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    ordersStore.hydrateAvailability(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersClientService.createOrder(payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.details() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrderPayload) =>
      ordersClientService.updateOrder(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useTransitionOrderStatusMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderStatusTransitionPayload) =>
      ordersClientService.transitionStatus(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useCancelOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderCancelPayload) =>
      ordersClientService.cancelOrder(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function usePickupOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PickupOrderPayload) =>
      ordersClientService.pickupOrder(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useProcessOrderReturnMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessOrderReturnPayload) =>
      ordersClientService.processOrderReturn(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useCompleteOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ordersClientService.completeOrder(orderId),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useSettleDebtOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ordersClientService.settleOrderDebt(orderId),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useAddOrderItemMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddOrderItemPayload) =>
      ordersClientService.addOrderItem(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useUpdateOrderItemPricingMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderItemId,
      payload,
    }: {
      orderItemId: string;
      payload: UpdateOrderItemPricingPayload;
    }) => ordersClientService.updateOrderItemPricing(orderId, orderItemId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
      ]);
    },
  });
}

export function useRemoveOrderItemMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderItemId: string) =>
      ordersClientService.removeOrderItem(orderId, orderItemId),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useAddOrderPaymentMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddOrderPaymentPayload) =>
      ordersClientService.addOrderPayment(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateOrderPaymentStatusMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: UpdateOrderPaymentStatusPayload;
    }) => ordersClientService.updateOrderPaymentStatus(orderId, paymentId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
      ]);
    },
  });
}

export function useAddOrderIncidentMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderIncidentPayload) =>
      ordersClientService.addOrderIncident(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
      ]);
    },
  });
}

export function useTransitionOrderStatusAnyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: OrderStatusTransitionPayload;
    }) => ordersClientService.transitionStatus(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.detail(detail.summary.id),
        }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function usePickupOrderAnyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: PickupOrderPayload;
    }) => ordersClientService.pickupOrder(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(detail.summary.id) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useCancelOrderAnyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: OrderCancelPayload;
    }) => ordersClientService.cancelOrder(orderId, payload),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ordersQueryKeys.detail(detail.summary.id),
        }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export function useSettleDebtOrderAnyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      ordersClientService.settleOrderDebt(orderId),
    onSuccess: async (detail) => {
      ordersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(detail.summary.id) }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.availabilities() }),
      ]);
    },
  });
}

export { ordersQueryKeys };
