import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import {
  closeSalesShiftForActor,
  getCurrentSalesShiftDetailForActor,
  getCurrentSalesShiftForActor,
  getSalesShiftDetailForActor,
  listSalesShiftsForActor,
  openSalesShiftForActor,
  SalesDeskDomainError,
} from "@/server/data-access/salesDesk";
import type {
  CloseSalesShiftPayload,
  OpenSalesShiftPayload,
  SalesShiftListQuery,
  SalesShiftStatus,
} from "@/types/salesDesk";

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.trunc(parsed));
}

function parseShiftStatus(value: string | null): SalesShiftStatus | null {
  const normalized = parseString(value)?.toUpperCase() ?? null;
  if (normalized === "OPEN" || normalized === "CLOSED") {
    return normalized;
  }
  return null;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseErrorText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveUnknownErrorPayload(error: unknown): {
  error: string;
  code?: string;
  details?: string;
  hint?: string;
} {
  if (error instanceof Error) {
    return {
      error: parseErrorText(error.message) ?? "Unexpected error",
    };
  }

  if (!error || typeof error !== "object") {
    return { error: "Unexpected error" };
  }

  const source = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  const message = parseErrorText(source.message) ?? "Unexpected error";
  const code = parseErrorText(source.code) ?? undefined;
  const details = parseErrorText(source.details) ?? undefined;
  const hint = parseErrorText(source.hint) ?? undefined;

  return {
    error: message,
    ...(code ? { code } : {}),
    ...(details ? { details } : {}),
    ...(hint ? { hint } : {}),
  };
}

function mapDomainError(error: unknown): NextResponse {
  if (error instanceof SalesDeskDomainError) {
    const payload = Object.keys(error.context ?? {}).length > 0
      ? { error: error.code, context: error.context }
      : { error: error.code };

    if (error.code === "INVALID_CASH_AMOUNT") {
      return NextResponse.json(payload, { status: 400 });
    }

    if (
      error.code === "FORBIDDEN_SALES_ACCESS" ||
      error.code === "FORBIDDEN_SHIFT_MANAGEMENT" ||
      error.code === "BRANCH_ACCESS_DENIED"
    ) {
      return NextResponse.json(payload, { status: 403 });
    }

    if (error.code === "SHIFT_NOT_FOUND") {
      return NextResponse.json(payload, { status: 404 });
    }

    if (
      error.code === "SHIFT_ALREADY_OPEN" ||
      error.code === "SHIFT_ALREADY_CLOSED" ||
      error.code === "SHIFT_VARIANCE_NOTE_REQUIRED" ||
      error.code === "MISSING_PROFILE_CONTEXT" ||
      error.code === "MISSING_BRANCH_CONTEXT"
    ) {
      return NextResponse.json(payload, { status: 409 });
    }

    return NextResponse.json(payload, { status: 400 });
  }

  return NextResponse.json(resolveUnknownErrorPayload(error), { status: 500 });
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

function parseOpenShiftPayload(body: Record<string, unknown>): OpenSalesShiftPayload | null {
  const openingCash = parseNumeric(body.openingCash);
  if (openingCash === null) return null;

  return {
    branchId: parseString(body.branchId),
    openingCash,
    note: parseString(body.note),
  };
}

function parseCloseShiftPayload(body: Record<string, unknown>): CloseSalesShiftPayload | null {
  const closingCash = parseNumeric(body.closingCash);
  if (closingCash === null) return null;

  return {
    branchId: parseString(body.branchId),
    shiftId: parseString(body.shiftId),
    closingCash,
    note: parseString(body.note),
  };
}

export async function handleGetCurrentSalesShift(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const branchId = parseString(request.nextUrl.searchParams.get("branchId"));

    const shift = await getCurrentSalesShiftForActor(supabase, {
      actorProfileId: profileId,
      branchId,
    });

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetCurrentSalesShiftDetail(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const branchId = parseString(request.nextUrl.searchParams.get("branchId"));

    const shift = await getCurrentSalesShiftDetailForActor(supabase, {
      actorProfileId: profileId,
      branchId,
    });

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleListSalesShifts(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const query: SalesShiftListQuery = {
      branchId: parseString(searchParams.get("branchId")),
      staffId: parseString(searchParams.get("staffId")),
      status: parseShiftStatus(searchParams.get("status")),
      fromDate: parseString(searchParams.get("fromDate")),
      toDate: parseString(searchParams.get("toDate")),
      page: parseInteger(searchParams.get("page"), 1),
      pageSize: parseInteger(searchParams.get("pageSize"), 20),
    };

    const payload = await listSalesShiftsForActor(supabase, {
      actorProfileId: profileId,
      query,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetSalesShiftDetail(
  request: NextRequest,
  shiftId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const branchId = parseString(request.nextUrl.searchParams.get("branchId"));

    const shift = await getSalesShiftDetailForActor(supabase, {
      actorProfileId: profileId,
      shiftId,
      branchId,
    });

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleOpenSalesShift(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = parseOpenShiftPayload(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const shift = await openSalesShiftForActor(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleCloseSalesShift(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = parseCloseShiftPayload(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const shift = await closeSalesShiftForActor(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}
