"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  DashboardOverviewQuery,
  DashboardOverviewResponse,
} from "@/types/dashboardOverview";
import type { OrderDetailDto, OrderStatusTransitionPayload } from "@/types/ordersDomain";
import type {
  RevenueReportQuery,
  RevenueReportResponse,
} from "@/types/reportsModule";

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
  method: "GET" | "PATCH",
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

export const dashboardClientService = {
  async fetchOverview(query: DashboardOverviewQuery): Promise<DashboardOverviewResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
    });

    const response = await fetch(
      `/api/dashboard/overview${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<DashboardOverviewResponse>(response);
  },

  async fetchFinancialRevenueReport(query: RevenueReportQuery): Promise<RevenueReportResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/reports/revenue${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<RevenueReportResponse>(response);
  },

  async quickReturnOrder(orderId: string): Promise<OrderDetailDto> {
    const payload: OrderStatusTransitionPayload = {
      toStatus: "RETURNED",
      reason: "DASHBOARD_QUICK_RETURN",
    };

    const response = await fetch(buildNestApiUrl(`/api/v1/orders/${orderId}/status`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<OrderDetailDto>(response);
  },
};
