import { NextRequest } from "next/server";
import { handleSummary } from "@/server/services/statsService";

export async function GET(request: NextRequest) {
  return handleSummary(request);
}
