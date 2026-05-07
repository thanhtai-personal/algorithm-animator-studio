import { NextRequest } from "next/server";
import { handleListSalesShifts } from "@/server/services/salesDeskService";

export async function GET(request: NextRequest) {
  return handleListSalesShifts(request);
}
