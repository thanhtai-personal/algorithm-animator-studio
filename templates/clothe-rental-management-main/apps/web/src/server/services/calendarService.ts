import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import {
  CalendarDomainError,
  getCalendarEventsForAdmin,
} from "@/server/data-access/calendar";
import {
  notifyCalendarRemindersForActor,
  runNotificationSideEffect,
} from "@/server/services/notificationDispatchService";

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
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
  if (error instanceof CalendarDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (error.code === "INVALID_DATE_RANGE" || error.code === "DATE_RANGE_TOO_LARGE") {
      return NextResponse.json(withContext, { status: 400 });
    }

    if (
      error.code === "FORBIDDEN_BRANCH_SCOPE" ||
      error.code === "FORBIDDEN_MANAGER_ACTION"
    ) {
      return NextResponse.json(withContext, { status: 403 });
    }

    if (error.code === "MISSING_BRANCH_CONTEXT") {
      return NextResponse.json(withContext, { status: 409 });
    }

    return NextResponse.json(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function handleGetCalendarEvents(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const startDateRaw = searchParams.get("startDate");
    const endDateRaw = searchParams.get("endDate");
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate/endDate are required in YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const payload = await getCalendarEventsForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get("branchId")),
        startDate,
        endDate,
      },
    });

    await runNotificationSideEffect(async () => {
      await notifyCalendarRemindersForActor({
        recipientProfileId: profileId,
        branchId: payload.branchId,
        today: payload.today,
        reminders: payload.reminders,
      });
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}
