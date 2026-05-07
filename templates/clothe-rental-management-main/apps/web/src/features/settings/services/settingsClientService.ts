"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  SalesShiftDetailResponse,
  SalesShiftListQuery,
  SalesShiftListResponse,
} from "@/types/salesDesk";
import type {
  PosPasskeyPolicyDto,
  PosPasskeyUpdatePayload,
  PosPasskeyVerifyPayload,
  PosPasskeyVerifyResponse,
  SettingLocale,
  SettingsBranchShopDomainCheckQuery,
  SettingsBranchShopDomainCheckResponse,
  SettingsBranchesResponse,
  SettingsCreateBranchPayload,
  SettingsCreateProductCategoryPayload,
  SettingsCreateShowroomPayload,
  SettingsCreateUserPayload,
  SettingsGeneralResponse,
  SettingsGeneralUpdatePayload,
  SettingsManagedProductCategoryDto,
  SettingsProductCategoriesResponse,
  SettingsResetUserPasswordPayload,
  SettingsShowroomPagesResponse,
  SettingsShowroomDto,
  SettingsShowroomsResponse,
  SettingsShowroomPagesUpdatePayload,
  SettingsUpdateBranchPayload,
  SettingsUpdateProductCategoryPayload,
  SettingsUpdateShowroomPayload,
  SettingsUpdateUserPayload,
  SettingsUserRowDto,
  SettingsUsersResponse,
} from "@/types/settingsModule";

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

  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    credentials: "same-origin",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export const settingsClientService = {
  async fetchGeneral(query: { branchId?: string | null }): Promise<SettingsGeneralResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/settings/general${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsGeneralResponse>(response);
  },

  async updateGeneral(payload: SettingsGeneralUpdatePayload): Promise<SettingsGeneralResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/general"),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<SettingsGeneralResponse>(response);
  },

  async fetchPosPasskeyPolicy(): Promise<PosPasskeyPolicyDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/pos-passkey-policy"),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<PosPasskeyPolicyDto>(response);
  },

  async verifyPosPasskey(
    payload: PosPasskeyVerifyPayload
  ): Promise<PosPasskeyVerifyResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/pos-passkey/verify"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<PosPasskeyVerifyResponse>(response);
  },

  async updatePosPasskey(
    payload: PosPasskeyUpdatePayload
  ): Promise<PosPasskeyPolicyDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/pos-passkey"),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<PosPasskeyPolicyDto>(response);
  },

  async fetchShowroomPages(query: {
    branchId?: string | null;
    locale?: SettingLocale | null;
    scope?: "branch" | "global" | null;
  }): Promise<SettingsShowroomPagesResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      locale: query.locale,
      scope: query.scope,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/settings/showroom-pages${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsShowroomPagesResponse>(response);
  },

  async updateShowroomPages(
    payload: SettingsShowroomPagesUpdatePayload
  ): Promise<SettingsShowroomPagesResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/showroom-pages"),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<SettingsShowroomPagesResponse>(response);
  },

  async fetchUsers(query: { branchId?: string | null }): Promise<SettingsUsersResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/settings/users${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsUsersResponse>(response);
  },

  async createUser(payload: SettingsCreateUserPayload): Promise<SettingsUserRowDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/users"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<SettingsUserRowDto>(response);
  },

  async updateUser(userId: string, payload: SettingsUpdateUserPayload): Promise<SettingsUserRowDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/users/${userId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<SettingsUserRowDto>(response);
  },

  async resetUserPassword(
    userId: string,
    payload: SettingsResetUserPasswordPayload
  ): Promise<{ success: true }> {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/users/${userId}/reset-password`),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<{ success: true }>(response);
  },

  async fetchBranches(): Promise<SettingsBranchesResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/branches"),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsBranchesResponse>(response);
  },

  async checkBranchShopDomain(
    query: SettingsBranchShopDomainCheckQuery
  ): Promise<SettingsBranchShopDomainCheckResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      shopDomain: query.shopDomain,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/settings/branches/check-shop-domain${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsBranchShopDomainCheckResponse>(response);
  },

  async createBranch(payload: SettingsCreateBranchPayload) {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/branches"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<SettingsBranchesResponse["items"][number]>(response);
  },

  async updateBranch(branchId: string, payload: SettingsUpdateBranchPayload) {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/branches/${branchId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<SettingsBranchesResponse["items"][number]>(response);
  },

  async fetchProductCategories(query: {
    branchId?: string | null;
  }): Promise<SettingsProductCategoriesResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/settings/product-categories${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsProductCategoriesResponse>(response);
  },

  async createProductCategory(
    payload: SettingsCreateProductCategoryPayload
  ): Promise<SettingsManagedProductCategoryDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/product-categories"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<SettingsManagedProductCategoryDto>(response);
  },

  async updateProductCategory(
    productCategoryId: string,
    payload: SettingsUpdateProductCategoryPayload
  ): Promise<SettingsManagedProductCategoryDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/product-categories/${productCategoryId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<SettingsManagedProductCategoryDto>(response);
  },

  async deleteProductCategory(productCategoryId: string): Promise<{ success: true }> {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/product-categories/${productCategoryId}`),
      await buildRequestInit("DELETE")
    );

    return parseJsonResponse<{ success: true }>(response);
  },

  async fetchShowrooms(): Promise<SettingsShowroomsResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/showrooms"),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SettingsShowroomsResponse>(response);
  },

  async createShowroom(payload: SettingsCreateShowroomPayload): Promise<SettingsShowroomDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/settings/showrooms"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<SettingsShowroomDto>(response);
  },

  async updateShowroom(showroomId: string, payload: SettingsUpdateShowroomPayload): Promise<SettingsShowroomDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/showrooms/${showroomId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<SettingsShowroomDto>(response);
  },

  async deleteShowroom(showroomId: string): Promise<{ success: true }> {
    const response = await fetch(buildNestApiUrl(`/api/v1/settings/showrooms/${showroomId}`),
      await buildRequestInit("DELETE")
    );

    return parseJsonResponse<{ success: true }>(response);
  },

  async fetchShifts(query: SalesShiftListQuery): Promise<SalesShiftListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      staffId: query.staffId,
      status: query.status,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(
      `/api/sales/shifts${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SalesShiftListResponse>(response);
  },

  async fetchShiftDetail(
    shiftId: string,
    branchId?: string | null
  ): Promise<SalesShiftDetailResponse> {
    const queryString = toQueryString({
      branchId,
    });

    const response = await fetch(
      `/api/sales/shifts/${shiftId}${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SalesShiftDetailResponse>(response);
  },
};
