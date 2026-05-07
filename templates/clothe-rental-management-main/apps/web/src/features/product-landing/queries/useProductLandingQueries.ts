"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { productLandingClientService } from "@/features/product-landing/services/productLandingClientService";
import { productLandingStore } from "@/features/product-landing/stores/productLandingStore";
import type { SettingLocale, PublicShowroomPageConfigDto } from "@/types/settingsModule";

const productLandingQueryKeys = {
  all: ["product-landing"] as const,
  config: (
    locale: SettingLocale,
    showroomSlug?: string | null,
    branchSlug?: string | null,
    shopDomain?: string | null
  ) =>
    [
      ...productLandingQueryKeys.all,
      "config",
      locale,
      showroomSlug ?? "",
      branchSlug ?? "",
      shopDomain ?? "",
    ] as const,
  featured: (
    locale: SettingLocale,
    showroomSlug: string | null | undefined,
    branchSlug: string | null | undefined,
    shopDomain: string | null | undefined,
    branchId: string | null | undefined,
    productIds: string[]
  ) =>
    [
      ...productLandingQueryKeys.all,
      "featured",
      locale,
      showroomSlug ?? "",
      branchSlug ?? "",
      shopDomain ?? "",
      branchId ?? "",
      productIds.join(","),
    ] as const,
};

export function useProductLandingConfigQuery(options: {
  locale: SettingLocale;
  showroomSlug?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  initialData?: PublicShowroomPageConfigDto | null;
}) {
  const query = useQuery({
    queryKey: productLandingQueryKeys.config(
      options.locale,
      options.showroomSlug,
      options.branchSlug,
      options.shopDomain
    ),
    queryFn: () =>
      productLandingClientService.fetchPublishedConfig({
        locale: options.locale,
        showroomSlug: options.showroomSlug,
        branchSlug: options.branchSlug,
        shopDomain: options.shopDomain,
      }),
    staleTime: 60_000,
    initialData: options.initialData ?? undefined,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    productLandingStore.hydrateConfig(query.data ?? null);
  }, [query.data, query.isSuccess]);

  return query;
}

export function useProductLandingFeaturedProductsQuery(options: {
  locale: SettingLocale;
  showroomSlug?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  branchId?: string | null;
  productIds: string[];
  enabled?: boolean;
}) {
  const normalizedProductIds = options.productIds;

  const query = useQuery({
    queryKey: productLandingQueryKeys.featured(
      options.locale,
      options.showroomSlug,
      options.branchSlug,
      options.shopDomain,
      options.branchId,
      normalizedProductIds
    ),
    queryFn: async () => {
      if (normalizedProductIds.length > 0) {
        return productLandingClientService.fetchFeaturedProducts({
          showroomSlug: options.showroomSlug,
          branchId: options.branchId,
          branchSlug: options.branchSlug,
          shopDomain: options.shopDomain,
          productIds: normalizedProductIds,
        });
      }

      return productLandingClientService.fetchFallbackProducts({
        showroomSlug: options.showroomSlug,
        branchId: options.branchId,
        branchSlug: options.branchSlug,
        shopDomain: options.shopDomain,
      });
    },
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    productLandingStore.hydrateFeaturedProducts(query.data);
  }, [query.data]);

  return query;
}
