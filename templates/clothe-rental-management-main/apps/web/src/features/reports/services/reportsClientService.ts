"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  IncidentsReportQuery,
  IncidentsReportResponse,
  RevenueReportQuery,
  RevenueReportResponse,
  UtilizationReportQuery,
  UtilizationReportResponse,
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

async function parseCsvResponse(response: Response): Promise<{ blob: Blob; fileName: string }> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fallbackFileName = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
  const match = disposition.match(/filename=([^;]+)/i);
  const fileName = match?.[1]?.trim() ?? fallbackFileName;

  return { blob, fileName };
}

async function buildRequestInit(method: "GET"): Promise<RequestInit> {
  const authHeaders = await getSupabaseAuthHeaders();

  return {
    method,
    headers: {
      ...authHeaders,
    },
    credentials: "same-origin",
    cache: "no-store",
  };
}

export const reportsClientService = {
  async fetchRevenueReport(query: RevenueReportQuery): Promise<RevenueReportResponse> {
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

  async exportRevenueCsv(query: RevenueReportQuery): Promise<{ blob: Blob; fileName: string }> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/reports/revenue/export${queryString}`),
      await buildRequestInit("GET")
    );

    return parseCsvResponse(response);
  },

  async fetchUtilizationReport(
    query: UtilizationReportQuery
  ): Promise<UtilizationReportResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/reports/utilization${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<UtilizationReportResponse>(response);
  },

  async exportUtilizationCsv(
    query: UtilizationReportQuery
  ): Promise<{ blob: Blob; fileName: string }> {
    const queryString = toQueryString({
      branchId: query.branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/reports/utilization/export${queryString}`),
      await buildRequestInit("GET")
    );

    return parseCsvResponse(response);
  },

  async fetchIncidentsReport(query: IncidentsReportQuery): Promise<IncidentsReportResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/reports/incidents${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<IncidentsReportResponse>(response);
  },

  async exportIncidentsCsv(query: IncidentsReportQuery): Promise<{ blob: Blob; fileName: string }> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/reports/incidents/export${queryString}`),
      await buildRequestInit("GET")
    );

    return parseCsvResponse(response);
  },
};
