import { NextRequest } from "next/server";
import { handleOpenSalesShift } from "@/server/services/salesDeskService";

export async function POST(request: NextRequest) {
  return handleOpenSalesShift(request);
}
