import { NextRequest } from "next/server";
import { handlePatchNotificationsReadAll } from "@/server/services/notificationsService";

export async function PATCH(request: NextRequest) {
  return handlePatchNotificationsReadAll(request);
}
