import { NextRequest } from "next/server";
import { handleGetSalesShiftDetail } from "@/server/services/salesDeskService";

interface SalesShiftDetailRouteContext {
  params: Promise<{ shiftId: string }>;
}

export async function GET(
  request: NextRequest,
  context: SalesShiftDetailRouteContext
) {
  const { shiftId } = await context.params;
  return handleGetSalesShiftDetail(request, shiftId);
}
