import { NextRequest } from "next/server";
import { handleCloseSalesShift } from "@/server/services/salesDeskService";

export async function POST(request: NextRequest) {
  return handleCloseSalesShift(request);
}
