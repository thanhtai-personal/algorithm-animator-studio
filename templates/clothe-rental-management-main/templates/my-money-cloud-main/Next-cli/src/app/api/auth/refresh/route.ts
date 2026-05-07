import { NextRequest } from "next/server";
import { handleRefresh } from "@/server/services/authService";

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}
