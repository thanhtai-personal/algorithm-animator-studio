"use client";

import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  CustomerAccountProfileResponse,
  UpdateCustomerAccountProfilePayload,
} from "@/types/customerAccount";

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

export const customerAccountClientService = {
  async fetchProfile() {
    const response = await fetch(
      "/api/customer/account",
      await buildRequestInit("GET")
    );

    const payload = await parseJsonResponse<CustomerAccountProfileResponse>(response);
    return payload.profile;
  },

  async updateProfile(payload: UpdateCustomerAccountProfilePayload) {
    const response = await fetch(
      "/api/customer/account",
      await buildRequestInit("PATCH", payload)
    );

    const data = await parseJsonResponse<CustomerAccountProfileResponse>(response);
    return data.profile;
  },
};
