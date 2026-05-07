"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import {
  getSupabaseAuthHeaders,
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import type { ItemStatus } from "@/types/domainPrimitives";
import type {
  BulkUpdateInventoryItemStatusPayload,
  InventoryBulkStatusUpdateResultDto,
  InventoryAddProductItemsPayload,
  InventoryItemDetailDto,
  InventoryListQuery,
  InventoryListResponse,
  InventoryProductListResponse,
  InventoryProductOptionsQuery,
  InventoryProductOptionsResponse,
  InventoryScanResultDto,
  UpdateInventoryItemStatusPayload,
} from "@/types/inventoryItems";
import type { ProductsListResponse } from "@/types/productsCatalog";

const PRODUCT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_PRODUCT_IMAGE_BUCKET ?? "product-images";

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

async function buildRequestInit(
  method: "GET" | "PATCH" | "POST",
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

export const inventoryClientService = {
  async fetchInventoryItems(query: InventoryListQuery): Promise<InventoryListResponse> {
    const queryString = toQueryString({
      viewMode: query.viewMode,
      branchId: query.branchId,
      status: query.status,
      excludeSold: query.excludeSold,
      productCategoryId: query.productCategoryId,
      size: query.size,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/inventory${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<InventoryListResponse>(response);
  },

  async fetchInventoryProducts(query: InventoryListQuery): Promise<InventoryProductListResponse> {
    const queryString = toQueryString({
      viewMode: "products",
      branchId: query.branchId,
      status: query.status,
      excludeSold: query.excludeSold,
      productCategoryId: query.productCategoryId,
      size: query.size,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/inventory${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<InventoryProductListResponse>(response);
  },

  async fetchInventoryProductOptions(
    query: InventoryProductOptionsQuery
  ): Promise<InventoryProductOptionsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      page: 1,
      pageSize: query.pageSize ?? 60,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/products${queryString}`),
      await buildRequestInit("GET")
    );
    const payload = await parseJsonResponse<ProductsListResponse>(response);

    return {
      items: payload.items.map((entry) => ({
        id: entry.id,
        branchId: entry.branchId,
        productCode: entry.productCode,
        name: entry.name,
      })),
    };
  },

  async fetchInventoryItemDetail(itemId: string): Promise<InventoryItemDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/inventory/${itemId}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<InventoryItemDetailDto>(response);
  },

  async updateInventoryItemStatus(
    itemId: string,
    payload: UpdateInventoryItemStatusPayload
  ): Promise<InventoryItemDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/inventory/${itemId}/status`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<InventoryItemDetailDto>(response);
  },

  async bulkUpdateInventoryItemStatus(
    payload: BulkUpdateInventoryItemStatusPayload
  ): Promise<InventoryBulkStatusUpdateResultDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/inventory/bulk-status"),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<InventoryBulkStatusUpdateResultDto>(response);
  },

  async scanInventoryItem(options: {
    code: string;
    branchId?: string | null;
  }): Promise<InventoryScanResultDto> {
    const queryString = toQueryString({
      code: options.code,
      branchId: options.branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/inventory/scan${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<InventoryScanResultDto>(response);
  },

  async addInventoryProductItems(payload: InventoryAddProductItemsPayload): Promise<void> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${payload.productId}/items`),
      await buildRequestInit("POST", {
        items: payload.items,
      })
    );
    await parseJsonResponse<Record<string, unknown>>(response);
  },

  resolveCoverImageUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith("https://") || path.startsWith("http://")) {
      return path;
    }

    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl ?? null;
  },

  toStatusPayload(args: {
    toStatus: ItemStatus;
    reasonCode?: string | null;
    reasonNote?: string | null;
    orderId?: string | null;
  }): UpdateInventoryItemStatusPayload {
    return {
      toStatus: args.toStatus,
      reasonCode: args.reasonCode ?? null,
      reasonNote: args.reasonNote ?? null,
      orderId: args.orderId ?? null,
    };
  },
};
