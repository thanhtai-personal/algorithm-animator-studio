"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  CreateCustomerPayload,
  CustomerDetailDto,
  CustomersListQuery,
  CustomersListResponse,
  CustomersTypeaheadQuery,
  CustomersTypeaheadResponse,
  UpdateCustomerPayload,
} from "@/types/customersCrm";

function toQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }

  const raw = searchParams.toString();
  return raw ? `?${raw}` : "";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

async function buildRequestInit(method: "GET" | "POST" | "PATCH", body?: unknown): Promise<RequestInit> {
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

export const customersClientService = {
  async fetchCustomers(query: CustomersListQuery): Promise<CustomersListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      tagId: query.tagId,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/customers${queryString}`), await buildRequestInit("GET"));
    return parseJsonResponse<CustomersListResponse>(response);
  },

  async createCustomer(payload: CreateCustomerPayload): Promise<CustomerDetailDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/customers"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<CustomerDetailDto>(response);
  },

  async fetchCustomerDetail(customerId: string): Promise<CustomerDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/customers/${customerId}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<CustomerDetailDto>(response);
  },

  async updateCustomer(
    customerId: string,
    payload: UpdateCustomerPayload
  ): Promise<CustomerDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/customers/${customerId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<CustomerDetailDto>(response);
  },

  async fetchCustomersTypeahead(
    query: CustomersTypeaheadQuery
  ): Promise<CustomersTypeaheadResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      limit: query.limit,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/customers/typeahead${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<CustomersTypeaheadResponse>(response);
  },
};
