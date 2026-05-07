import { NextRequest } from "next/server";
import { handleGetCurrentSalesShiftDetail } from "@/server/services/salesDeskService";

export async function GET(request: NextRequest) {
  return handleGetCurrentSalesShiftDetail(request);
}
