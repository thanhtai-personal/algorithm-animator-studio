import { NextRequest } from "next/server";
import { handlePatchNotificationRead } from "@/server/services/notificationsService";

interface NotificationReadRouteContext {
  params: Promise<{ notificationId: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: NotificationReadRouteContext
) {
  const { notificationId } = await context.params;
  return handlePatchNotificationRead(request, notificationId);
}
