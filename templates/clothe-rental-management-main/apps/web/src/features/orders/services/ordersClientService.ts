"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  AddOrderPaymentPayload,
  AddOrderItemPayload,
  CreateOrderIncidentPayload,
  CreateOrderPayload,
  OrderAvailabilityResponse,
  OrderCancelPayload,
  OrderDetailDto,
  OrdersListQuery,
  OrdersListResponse,
  OrderStatusTransitionPayload,
  PickupOrderPayload,
  ProcessOrderReturnPayload,
  UpdateOrderPaymentStatusPayload,
  UpdateOrderItemPricingPayload,
  UpdateOrderPayload,
} from "@/types/ordersDomain";

function toQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const raw = search.toString();
  return raw ? `?${raw}` : "";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

async function buildRequestInit(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<RequestInit> {
  const authHeaders = await getSupabaseAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}

export const ordersClientService = {
  async fetchOrders(query: OrdersListQuery): Promise<OrdersListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      orderType: query.orderTypes?.join(","),
      status: query.statuses?.join(","),
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
      staffId: query.staffId,
      paymentStatus: query.paymentStatus,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/orders${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<OrdersListResponse>(response);
  },

  async checkAvailability(options: {
    branchId?: string | null;
    itemIds: string[];
    startDate: string;
    endDate: string;
    excludeOrderId?: string | null;
  }): Promise<OrderAvailabilityResponse> {
    const queryString = toQueryString({
      branchId: options.branchId,
      itemIds: options.itemIds.join(","),
      startDate: options.startDate,
      endDate: options.endDate,
      excludeOrderId: options.excludeOrderId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/orders/availability${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<OrderAvailabilityResponse>(response);
  },

  async createOrder(payload: CreateOrderPayload): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/orders"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async fetchOrderDetail(orderId: string): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async updateOrder(
    orderId: string,
    payload: UpdateOrderPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async transitionStatus(
    orderId: string,
    payload: OrderStatusTransitionPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/status`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async pickupOrder(
    orderId: string,
    payload: PickupOrderPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/pickup`),
      await buildRequestInit("POST", payload)
    );

    const parsed = (await response.json().catch(() => ({}))) as
      | ({ error?: string; reason?: string } & OrderDetailDto)
      | Record<string, unknown>;

    if (!response.ok) {
      const errorCode =
        typeof (parsed as { error?: unknown }).error === "string"
          ? (parsed as { error: string }).error
          : null;
      const reason =
        typeof (parsed as { reason?: unknown }).reason === "string"
          ? (parsed as { reason: string }).reason
          : null;

      if (errorCode === "PICKUP_NOT_ALLOWED" && reason) {
        throw new Error(`${errorCode}:${reason}`);
      }

      throw new Error(errorCode ?? "Request failed");
    }

    return parsed as OrderDetailDto;
  },

  async processOrderReturn(
    orderId: string,
    payload: ProcessOrderReturnPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/return`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async completeOrder(orderId: string): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/complete`),
      await buildRequestInit("POST")
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async settleOrderDebt(orderId: string): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/settle-debt`),
      await buildRequestInit("POST")
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async cancelOrder(
    orderId: string,
    payload: OrderCancelPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/cancel`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async addOrderItem(
    orderId: string,
    payload: AddOrderItemPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/items`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async addOrderPayment(
    orderId: string,
    payload: AddOrderPaymentPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/payments`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async updateOrderPaymentStatus(
    orderId: string,
    paymentId: string,
    payload: UpdateOrderPaymentStatusPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/payments/${paymentId}/status`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async addOrderIncident(
    orderId: string,
    payload: CreateOrderIncidentPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/incidents`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async updateOrderItemPricing(
    orderId: string,
    orderItemId: string,
    payload: UpdateOrderItemPricingPayload
  ): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/items/${orderItemId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },

  async removeOrderItem(orderId: string, orderItemId: string): Promise<OrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/items/${orderItemId}`),
      await buildRequestInit("DELETE")
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },
};
