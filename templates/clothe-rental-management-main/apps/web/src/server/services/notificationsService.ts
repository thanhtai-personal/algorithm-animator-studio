import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import {
  listNotificationsForProfile,
  markAllNotificationsReadForProfile,
  markNotificationReadForProfile,
  NotificationsDomainError,
} from "@/server/data-access/notifications";

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseInteger(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseBoolean(value: string | null | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

async function getAuthedClient(request: NextRequest) {
  const { supabase, user } = await getSupabaseClientAndUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    supabase,
    profileId: user.id,
  };
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function mapDomainError(error: unknown): NextResponse {
  if (error instanceof NotificationsDomainError) {
    const payload = Object.keys(error.context ?? {}).length > 0
      ? { error: error.code, context: error.context }
      : { error: error.code };

    if (error.code === "INVALID_NOTIFICATION_CURSOR" || error.code === "INVALID_NOTIFICATION_LIMIT") {
      return NextResponse.json(payload, { status: 400 });
    }

    if (error.code === "NOTIFICATION_NOT_FOUND") {
      return NextResponse.json(payload, { status: 404 });
    }

    if (error.code === "MISSING_PROFILE_CONTEXT") {
      return NextResponse.json(payload, { status: 409 });
    }

    return NextResponse.json(payload, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function handleGetNotifications(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const isReadRaw = parseString(searchParams.get("isRead"));
    const isRead = isReadRaw ? parseBoolean(isReadRaw) : null;
    if (isReadRaw && isRead === null) {
      return NextResponse.json({ error: "isRead must be true/false" }, { status: 400 });
    }

    const payload = await listNotificationsForProfile(supabase, {
      actorProfileId: profileId,
      query: {
        cursor: parseString(searchParams.get("cursor")),
        limit: parseInteger(searchParams.get("limit"), 20),
        isRead,
      },
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchNotificationRead(
  request: NextRequest,
  notificationId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const payload = await markNotificationReadForProfile(supabase, {
      actorProfileId: profileId,
      notificationId,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchNotificationsReadAll(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const payload = await markAllNotificationsReadForProfile(supabase, {
      actorProfileId: profileId,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}
