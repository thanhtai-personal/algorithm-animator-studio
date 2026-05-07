import type { ZaloMiniAppProductSummaryDto } from "@/lib/contracts";

export interface ShowroomProductsResponseDto {
  items: Array<{
    id: string;
    title: string;
    salePrice: number | null;
    coverImagePath: string | null;
  }>;
}

export function mapShowroomProductToMiniApp(
  item: ShowroomProductsResponseDto["items"][number]
): ZaloMiniAppProductSummaryDto {
  return {
    id: item.id,
    productCode: item.id.slice(0, 8),
    name: item.title,
    coverImagePath: item.coverImagePath,
    salePrice: item.salePrice ?? 0,
  };
}
