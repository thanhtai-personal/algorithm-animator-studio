import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import {
  CustomerAccountDomainError,
  getCustomerAccountProfile,
  updateCustomerAccountProfile,
} from "@/server/data-access/customerAccount";
import type { UpdateCustomerAccountProfilePayload } from "@/types/customerAccount";

function parseString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value;
}

function parseUpdatePayload(
  body: Record<string, unknown>
): UpdateCustomerAccountProfilePayload | null {
  const payload: UpdateCustomerAccountProfilePayload = {};

  if (Object.prototype.hasOwnProperty.call(body, "fullName")) {
    const fullName = parseString(body.fullName);
    if (fullName === undefined) return null;
    payload.fullName = fullName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const email = parseString(body.email);
    if (email === undefined) return null;
    payload.email = email;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const phone = parseString(body.phone);
    if (phone === undefined) return null;
    payload.phone = phone;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

async function resolveAuthedUserId(request: NextRequest): Promise<string> {
  const { user } = await getSupabaseClientAndUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user.id;
}

function mapDomainError(error: unknown) {
  if (error instanceof CustomerAccountDomainError) {
    if (error.code === "PROFILE_NOT_FOUND") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (error.code === "FORBIDDEN_ROLE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      error.code === "INVALID_FULL_NAME" ||
      error.code === "INVALID_EMAIL" ||
      error.code === "INVALID_PHONE"
    ) {
      return NextResponse.json(
        {
          error: error.code,
          field: error.context.field ?? null,
        },
        { status: 400 }
      );
    }

    if (error.code === "EMAIL_IN_USE" || error.code === "PHONE_IN_USE") {
      return NextResponse.json(
        {
          error: error.code,
          field: error.context.field ?? null,
        },
        { status: 409 }
      );
    }
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function handleGetCustomerAccountProfile(request: NextRequest) {
  try {
    const userId = await resolveAuthedUserId(request);
    const profile = await getCustomerAccountProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return mapDomainError(error);
  }
}

export async function handlePatchCustomerAccountProfile(request: NextRequest) {
  try {
    const userId = await resolveAuthedUserId(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseUpdatePayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const profile = await updateCustomerAccountProfile({
      profileId: userId,
      payload,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return mapDomainError(error);
  }
}
