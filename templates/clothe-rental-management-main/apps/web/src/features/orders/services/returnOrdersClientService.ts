"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  CreateReturnOrderPayload,
  ReturnOrderDetailDto,
  ReturnOrderSourcesQuery,
  ReturnOrderSourcesResponse,
  SettleReturnOrderPayload,
  TransitionReturnOrderStatusPayload,
} from "@/types/returnOrdersDomain";

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
  method: "GET" | "POST" | "PATCH",
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

export const returnOrdersClientService = {
  async fetchSources(query: ReturnOrderSourcesQuery): Promise<ReturnOrderSourcesResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/return-orders/sources${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ReturnOrderSourcesResponse>(response);
  },

  async fetchDetail(returnOrderId: string): Promise<ReturnOrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/return-orders/${returnOrderId}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ReturnOrderDetailDto>(response);
  },

  async createReturnOrder(payload: CreateReturnOrderPayload): Promise<ReturnOrderDetailDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/return-orders"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<ReturnOrderDetailDto>(response);
  },

  async transitionStatus(
    returnOrderId: string,
    payload: TransitionReturnOrderStatusPayload
  ): Promise<ReturnOrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/return-orders/${returnOrderId}/status`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<ReturnOrderDetailDto>(response);
  },

  async settleReturnOrder(
    returnOrderId: string,
    payload: SettleReturnOrderPayload
  ): Promise<ReturnOrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/return-orders/${returnOrderId}/settle`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<ReturnOrderDetailDto>(response);
  },

  async completeReturnOrder(returnOrderId: string): Promise<ReturnOrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/return-orders/${returnOrderId}/complete`),
      await buildRequestInit("POST")
    );

    return parseJsonResponse<ReturnOrderDetailDto>(response);
  },

  async cancelReturnOrder(
    returnOrderId: string,
    reason?: string | null
  ): Promise<ReturnOrderDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/return-orders/${returnOrderId}/cancel`),
      await buildRequestInit("POST", { reason: reason ?? null })
    );

    return parseJsonResponse<ReturnOrderDetailDto>(response);
  },
};
