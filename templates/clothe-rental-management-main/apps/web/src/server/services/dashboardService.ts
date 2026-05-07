import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import {
  DashboardDomainError,
  getDashboardOverviewForAdmin,
} from "@/server/data-access/dashboard";

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  if (error instanceof DashboardDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (error.code === "MISSING_BRANCH_CONTEXT") {
      return NextResponse.json(withContext, { status: 409 });
    }

    if (
      error.code === "FORBIDDEN_BRANCH_SCOPE" ||
      error.code === "FORBIDDEN_MANAGER_ACTION"
    ) {
      return NextResponse.json(withContext, { status: 403 });
    }

    return NextResponse.json(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function handleGetDashboardOverview(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const overview = await getDashboardOverviewForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get("branchId")),
      },
    });

    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}
