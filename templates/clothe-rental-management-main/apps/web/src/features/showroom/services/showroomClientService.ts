"use client";

import { SHOWROOM_PRODUCT_IMAGE_BUCKET } from "@/features/showroom/constants";
import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  ShowroomProductDetailDto,
  ShowroomProductDetailQuery,
  ShowroomProductsQuery,
  ShowroomProductsResponse,
} from "@/types/productsCatalog";
import type {
  PublicShowroomPageConfigDto,
  PublicShowroomPageConfigQuery,
} from "@/types/settingsModule";

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

export const showroomClientService = {
  async fetchPublishedConfig(
    query: PublicShowroomPageConfigQuery
  ): Promise<PublicShowroomPageConfigDto | null> {
    const queryString = toQueryString({
      showroomSlug: query.showroomSlug,
      branchId: query.branchId,
      branchSlug: query.branchSlug,
      shopDomain: query.shopDomain,
      locale: query.locale,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/settings/public/showroom-config${queryString}`),
      {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      }
    );

    return parseJsonResponse<PublicShowroomPageConfigDto | null>(response);
  },

  async fetchProducts(query: ShowroomProductsQuery): Promise<ShowroomProductsResponse> {
    const queryString = toQueryString({
      showroomSlug: query.showroomSlug,
      branchId: query.branchId,
      branchSlug: query.branchSlug,
      shopDomain: query.shopDomain,
      search: query.search,
      productCategoryId: query.productCategoryId,
      productCategoryIds:
        Array.isArray(query.productCategoryIds) && query.productCategoryIds.length > 0
          ? query.productCategoryIds.join(",")
          : undefined,
      tagId: query.tagId,
      gender: query.gender,
      genders:
        Array.isArray(query.genders) && query.genders.length > 0
          ? query.genders.join(",")
          : undefined,
      size: query.size,
      sizes:
        Array.isArray(query.sizes) && query.sizes.length > 0
          ? query.sizes.join(",")
          : undefined,
      color: query.color,
      productIds:
        Array.isArray(query.productIds) && query.productIds.length > 0
          ? query.productIds.join(",")
          : undefined,
      preferRecentIntake: query.preferRecentIntake ? 1 : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/products/showroom${queryString}`),
      {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      }
    );

    return parseJsonResponse<ShowroomProductsResponse>(response);
  },

  async fetchProductDetail(
    productId: string,
    query: ShowroomProductDetailQuery
  ): Promise<ShowroomProductDetailDto> {
    const queryString = toQueryString({
      showroomSlug: query.showroomSlug,
      branchId: query.branchId,
      branchSlug: query.branchSlug,
      shopDomain: query.shopDomain,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/products/showroom/${productId}${queryString}`),
      {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      }
    );

    return parseJsonResponse<ShowroomProductDetailDto>(response);
  },

  resolveCoverImageUrl(path: string | null): string | null {
    if (!path) return null;

    const normalizedPath = path.trim();
    if (!normalizedPath) return null;

    const directSrc = normalizeRenderableImageSrc(normalizedPath);
    if (directSrc) {
      return directSrc;
    }

    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase.storage
        .from(SHOWROOM_PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(normalizedPath);

      return normalizeRenderableImageSrc(data.publicUrl);
    } catch {
      return null;
    }
  },
};
