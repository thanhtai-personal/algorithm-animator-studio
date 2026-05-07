import { requestJson } from "@/lib/httpClient";
import type { ZaloMiniAppProductSummaryDto } from "@/lib/contracts";
import {
  mapShowroomProductToMiniApp,
  type ShowroomProductsResponseDto,
} from "@/features/products/types/products";

export const zaloMiniAppCatalogService = {
  async fetchProducts(): Promise<ZaloMiniAppProductSummaryDto[]> {
    const query = new URLSearchParams({ page: "1", pageSize: "12" });

    const response = await requestJson<ShowroomProductsResponseDto>(
      `/api/v1/products/showroom?${query.toString()}`
    );

    return (response.items ?? []).map(mapShowroomProductToMiniApp);
  },
};
