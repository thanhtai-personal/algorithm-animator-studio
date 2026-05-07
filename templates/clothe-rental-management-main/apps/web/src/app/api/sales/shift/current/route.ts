import { NextRequest } from "next/server";
import { handleGetCurrentSalesShift } from "@/server/services/salesDeskService";

export async function GET(request: NextRequest) {
  return handleGetCurrentSalesShift(request);
}
