import { NextRequest } from "next/server";
import { handleGetNotifications } from "@/server/services/notificationsService";

export async function GET(request: NextRequest) {
  return handleGetNotifications(request);
}
