"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import type {
  ShowroomProductCardDto,
  ShowroomProductsResponse,
} from "@/types/productsCatalog";
import type {
  PublicShowroomPageConfigDto,
  PublicShowroomPageConfigQuery,
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

export const productLandingClientService = {
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

  async fetchFeaturedProducts(options: {
    showroomSlug?: string | null;
    branchId?: string | null;
    branchSlug?: string | null;
    shopDomain?: string | null;
    productIds: string[];
  }): Promise<ShowroomProductCardDto[]> {
    const queryString = toQueryString({
      showroomSlug: options.showroomSlug,
      branchId: options.branchId,
      branchSlug: options.branchSlug,
      shopDomain: options.shopDomain,
      page: 1,
      pageSize: Math.max(4, Math.min(24, options.productIds.length || 4)),
      productIds: options.productIds.length > 0 ? options.productIds.join(",") : undefined,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/products/showroom${queryString}`),
      {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      }
    );

    const payload = await parseJsonResponse<ShowroomProductsResponse>(response);
    return payload.items;
  },

  async fetchFallbackProducts(options: {
    showroomSlug?: string | null;
    branchId?: string | null;
    branchSlug?: string | null;
    shopDomain?: string | null;
  }): Promise<ShowroomProductCardDto[]> {
    const queryString = toQueryString({
      showroomSlug: options.showroomSlug,
      branchId: options.branchId,
      branchSlug: options.branchSlug,
      shopDomain: options.shopDomain,
      page: 1,
      pageSize: 10,
      preferRecentIntake: 1,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/products/showroom${queryString}`),
      {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      }
    );

    const payload = await parseJsonResponse<ShowroomProductsResponse>(response);
    return payload.items;
  },
};
