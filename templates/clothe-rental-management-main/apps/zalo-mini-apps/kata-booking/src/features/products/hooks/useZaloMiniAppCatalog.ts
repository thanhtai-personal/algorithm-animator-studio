import { useZaloCatalogQuery } from "@/features/products/queries/useZaloMiniAppCatalogQueries";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import { zaloCatalogStore } from "@/features/products/stores/zaloCatalogStore";

export function useZaloMiniAppCatalog() {
  const query = useZaloCatalogQuery(zaloMiniAppAuthStore.isAuthenticated);

  return {
    query,
    items: zaloCatalogStore.items,
  };
}
