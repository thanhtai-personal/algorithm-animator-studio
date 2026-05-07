"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { PRODUCT_IMAGE_BUCKET } from "@/features/products/constants";
import {
  getSupabaseAuthHeaders,
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import type {
  AddProductItemsRequestPayload,
  CreateProductPayload,
  ProductDetailDto,
  ProductsListQuery,
  ProductsListResponse,
  ShowroomProductsQuery,
  ShowroomProductsResponse,
  UpdateProductItemPayload,
  UpdateProductOverviewPayload,
  UpdateProductPricingPayload,
} from "@/types/productsCatalog";

function toQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
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

async function buildJsonRequestInit(method: string, body?: unknown): Promise<RequestInit> {
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

type ProductMediaKind = "cover" | "gallery" | "video";

export const productsClientService = {
  async fetchProducts(query: ProductsListQuery): Promise<ProductsListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      productCategoryId: query.productCategoryId,
      tagId: query.tagId,
      hasReadyItems: query.hasReadyItems,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/products${queryString}`), await buildJsonRequestInit("GET"));
    return parseJsonResponse<ProductsListResponse>(response);
  },

  async createProduct(payload: CreateProductPayload): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/products"),
      await buildJsonRequestInit("POST", payload)
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async fetchProductDetail(productId: string): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}`),
      await buildJsonRequestInit("GET")
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async deleteProduct(productId: string): Promise<{ success: true }> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}`),
      await buildJsonRequestInit("DELETE")
    );
    return parseJsonResponse<{ success: true }>(response);
  },

  async updateProductOverview(
    productId: string,
    payload: UpdateProductOverviewPayload
  ): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}`),
      await buildJsonRequestInit("PATCH", payload)
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async updatePricing(
    productId: string,
    payload: UpdateProductPricingPayload
  ): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}/pricing`),
      await buildJsonRequestInit("PATCH", payload)
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async addProductItems(
    productId: string,
    payload: AddProductItemsRequestPayload
  ): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}/items`),
      await buildJsonRequestInit("POST", payload)
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async updateProductItem(
    productId: string,
    itemId: string,
    payload: UpdateProductItemPayload
  ): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}/items/${itemId}`),
      await buildJsonRequestInit("PATCH", payload)
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async deleteProductItem(
    productId: string,
    itemId: string
  ): Promise<ProductDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/products/${productId}/items/${itemId}`),
      await buildJsonRequestInit("DELETE")
    );
    return parseJsonResponse<ProductDetailDto>(response);
  },

  async fetchShowroomProducts(query: ShowroomProductsQuery): Promise<ShowroomProductsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      productCategoryId: query.productCategoryId,
      tagId: query.tagId,
      gender: query.gender,
      size: query.size,
      color: query.color,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/products/showroom${queryString}`),
      await buildJsonRequestInit("GET")
    );
    return parseJsonResponse<ShowroomProductsResponse>(response);
  },

  async uploadProductMediaAsset(
    productId: string,
    file: File,
    kind: ProductMediaKind
  ): Promise<string> {
    const supabase = getSupabaseBrowserClient();
    const fileName = sanitizeFileName(file.name || `${kind}-asset`);
    const path = `products/${productId}/${kind}/${Date.now()}-${fileName}`;

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

  async uploadProductCover(productId: string, file: File): Promise<string> {
    return this.uploadProductMediaAsset(productId, file, "cover");
  },

  resolveCoverImageUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl ?? null;
  },
};
