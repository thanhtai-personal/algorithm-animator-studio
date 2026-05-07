"use client";

import { PRODUCT_IMAGE_BUCKET } from "@/features/products/constants";
import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import {
  getSupabaseAuthHeaders,
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import type { ProductDetailDto } from "@/types/productsCatalog";
import type {
  CreatePosManualPaymentPayload,
  PaymentListItemDto,
} from "@/types/paymentsDomain";
import type {
  CreateSalesProductEntryPayload,
  SalesProductsCatalogQuery,
  SalesProductsCatalogResponse,
  UpdateSalesProductEntryPayload,
} from "@/types/salesProductEntry";
import type {
  CloseSalesShiftPayload,
  OpenSalesShiftPayload,
  SalesShiftActionResponse,
  SalesShiftCurrentDetailResponse,
  SalesShiftCurrentResponse,
  SalesShiftDetailResponse,
  SalesShiftListQuery,
  SalesShiftListResponse,
} from "@/types/salesDesk";
import type {
  PosPasskeyPolicyDto,
  PosPasskeyVerifyPayload,
  PosPasskeyVerifyResponse,
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

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const salesClientService = {
  async fetchCurrentShift(branchId?: string | null): Promise<SalesShiftCurrentResponse> {
    const queryString = toQueryString({
      branchId,
    });

    const response = await fetch(
      `/api/sales/shift/current${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SalesShiftCurrentResponse>(response);
  },

  async fetchCurrentShiftDetail(
    branchId?: string | null
  ): Promise<SalesShiftCurrentDetailResponse> {
    const queryString = toQueryString({
      branchId,
    });

    const response = await fetch(
      `/api/sales/shift/current-detail${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SalesShiftCurrentDetailResponse>(response);
  },

  async openShift(payload: OpenSalesShiftPayload): Promise<SalesShiftActionResponse> {
    const response = await fetch(
      "/api/sales/shift/open",
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<SalesShiftActionResponse>(response);
  },

  async closeShift(payload: CloseSalesShiftPayload): Promise<SalesShiftActionResponse> {
    const response = await fetch(
      "/api/sales/shift/close",
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<SalesShiftActionResponse>(response);
  },

  async fetchPosPasskeyPolicy(): Promise<PosPasskeyPolicyDto> {
    const response = await fetch(
      buildNestApiUrl("/api/v1/settings/pos-passkey-policy"),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<PosPasskeyPolicyDto>(response);
  },

  async verifyPosPasskey(
    payload: PosPasskeyVerifyPayload
  ): Promise<PosPasskeyVerifyResponse> {
    const response = await fetch(
      buildNestApiUrl("/api/v1/settings/pos-passkey/verify"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<PosPasskeyVerifyResponse>(response);
  },

  async fetchSalesShiftList(query: SalesShiftListQuery): Promise<SalesShiftListResponse> {
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

  async fetchSalesShiftDetail(
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

  async createPosManualPayment(
    payload: CreatePosManualPaymentPayload
  ): Promise<PaymentListItemDto> {
    const response = await fetch(
      buildNestApiUrl("/api/v1/payments"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<PaymentListItemDto>(response);
  },

  async fetchSalesProducts(
    query: SalesProductsCatalogQuery
  ): Promise<SalesProductsCatalogResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      productCategoryId: query.productCategoryId,
      tagId: query.tagId,
      hasReadyItems: query.hasReadyItems,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(
      `/api/sales/products${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<SalesProductsCatalogResponse>(response);
  },

  async createSalesProductEntry(
    payload: CreateSalesProductEntryPayload
  ): Promise<ProductDetailDto> {
    const response = await fetch(
      "/api/sales/products",
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<ProductDetailDto>(response);
  },

  async fetchSalesProductDetail(
    productId: string,
    branchId?: string | null
  ): Promise<ProductDetailDto> {
    const queryString = toQueryString({
      branchId,
    });

    const response = await fetch(
      `/api/sales/products/${productId}${queryString}`,
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ProductDetailDto>(response);
  },

  async updateSalesProduct(
    productId: string,
    payload: UpdateSalesProductEntryPayload & { branchId?: string | null }
  ): Promise<ProductDetailDto> {
    const response = await fetch(
      `/api/sales/products/${productId}`,
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<ProductDetailDto>(response);
  },

  async uploadSalesProductCover(productId: string, file: File): Promise<string> {
    const supabase = getSupabaseBrowserClient();
    const fileName = sanitizeFileName(file.name || "cover-image");
    const path = `products/${productId}/${Date.now()}-${fileName}`;

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) {
      throw error;
    }

    return path;
  },
};
