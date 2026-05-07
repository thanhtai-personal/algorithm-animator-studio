import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { zaloMiniAppCatalogService } from "@/features/products/services/zaloMiniAppCatalogService";
import { zaloCatalogStore } from "@/features/products/stores/zaloCatalogStore";

export const zaloCatalogQueryKeys = {
  all: ["zalo-catalog"] as const,
  list: () => [...zaloCatalogQueryKeys.all, "list"] as const,
};

export function useZaloCatalogQuery(enabled: boolean) {
  const query = useQuery({
    queryKey: zaloCatalogQueryKeys.list(),
    queryFn: () => zaloMiniAppCatalogService.fetchProducts(),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    zaloCatalogStore.hydrateItems(query.data);
  }, [query.data]);

  return query;
}
