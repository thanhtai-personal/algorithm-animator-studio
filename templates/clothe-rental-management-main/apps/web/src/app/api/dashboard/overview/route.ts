import { NextRequest } from "next/server";
import { handleGetDashboardOverview } from "@/server/services/dashboardService";

export async function GET(request: NextRequest) {
  return handleGetDashboardOverview(request);
}
