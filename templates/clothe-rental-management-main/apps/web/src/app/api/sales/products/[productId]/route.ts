import { NextRequest } from "next/server";
import {
  handleGetSalesProductDetail,
  handlePatchSalesProduct,
} from "@/server/services/productsService";

interface SalesProductRouteContext {
  params: Promise<{ productId: string }>;
}

export async function GET(request: NextRequest, context: SalesProductRouteContext) {
  const { productId } = await context.params;
  return handleGetSalesProductDetail(request, productId);
}

export async function PATCH(request: NextRequest, context: SalesProductRouteContext) {
  const { productId } = await context.params;
  return handlePatchSalesProduct(request, productId);
}
