"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import type {
  ShowroomProductDetailQuery,
  ShowroomProductsQuery,
} from "@/types/productsCatalog";
import type {
  PublicShowroomPageConfigDto,
  PublicShowroomPageConfigQuery,
  SettingLocale,
} from "@/types/settingsModule";

const showroomQueryKeys = {
  all: ["showroom"] as const,
  config: (query: PublicShowroomPageConfigQuery) =>
    [
      ...showroomQueryKeys.all,
      "config",
      query.showroomSlug ?? "",
      query.branchId ?? "",
      query.branchSlug ?? "",
      query.shopDomain ?? "",
      query.locale,
    ] as const,
  list: (query: ShowroomProductsQuery) =>
    [
      ...showroomQueryKeys.all,
      "list",
      query.showroomSlug ?? "",
      query.branchId ?? "",
      query.branchSlug ?? "",
      query.shopDomain ?? "",
      query.search ?? "",
      query.productCategoryId ?? "",
      (query.productCategoryIds ?? []).join(","),
      query.tagId ?? "",
      query.gender ?? "",
      (query.genders ?? []).join(","),
      query.size ?? "",
      (query.sizes ?? []).join(","),
      query.color ?? "",
      (query.productIds ?? []).join(","),
      query.preferRecentIntake ? "1" : "0",
      query.page ?? 1,
      query.pageSize ?? 12,
    ] as const,
  detail: (productId: string, query: ShowroomProductDetailQuery) =>
    [
      ...showroomQueryKeys.all,
      "detail",
      productId,
      query.showroomSlug ?? "",
      query.branchId ?? "",
      query.branchSlug ?? "",
      query.shopDomain ?? "",
    ] as const,
};

export function useShowroomConfigQuery(options: {
  locale: SettingLocale;
  showroomSlug?: string | null;
  branchId?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  initialData?: PublicShowroomPageConfigDto | null;
}) {
  const query = useQuery({
    queryKey: showroomQueryKeys.config({
      showroomSlug: options.showroomSlug,
      branchId: options.branchId,
      branchSlug: options.branchSlug,
      shopDomain: options.shopDomain,
      locale: options.locale,
    }),
    queryFn: () =>
      showroomClientService.fetchPublishedConfig({
        showroomSlug: options.showroomSlug,
        branchId: options.branchId,
        branchSlug: options.branchSlug,
        shopDomain: options.shopDomain,
        locale: options.locale,
      }),
    staleTime: 60_000,
    initialData: options.initialData ?? undefined,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    showroomStore.hydrateConfig(query.data ?? null);
  }, [query.data, query.isSuccess]);

  return query;
}

export function useShowroomProductsQuery(
  query: ShowroomProductsQuery,
  options?: { append?: boolean }
) {
  const queryResult = useQuery({
    queryKey: showroomQueryKeys.list(query),
    queryFn: () => showroomClientService.fetchProducts(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    showroomStore.hydrateList(queryResult.data, {
      append: options?.append,
    });
  }, [options?.append, queryResult.data]);

  return queryResult;
}

export function useShowroomProductDetailQuery(
  productId: string,
  query: ShowroomProductDetailQuery
) {
  const queryResult = useQuery({
    queryKey: showroomQueryKeys.detail(productId, query),
    queryFn: () => showroomClientService.fetchProductDetail(productId, query),
    enabled: Boolean(productId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    showroomStore.hydrateDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export { showroomQueryKeys };
