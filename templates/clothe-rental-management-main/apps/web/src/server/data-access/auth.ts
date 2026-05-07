import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  resolveSiteUrl,
} from "@/lib/supabase/config";
import { createSupabaseClientWithToken } from "@/lib/supabase/request";
import type {
  ApiAuthUserProfilePayload,
  ApiProfileBranchAccessRow,
  ApiProfileRow,
} from "@/server/types/auth";

const PROFILE_ROLE_SET = new Set([
  "manager",
  "staff",
  "accountant",
  "makeup_artist",
  "customer",
]);
const PROFILE_LOCALE_SET = new Set(["vi", "en"]);

interface AuthAdminUserMetadata {
  [key: string]: unknown;
}

interface AuthAdminUserForProfileSync {
  id: string;
  email: string | null;
  phone: string | null;
  app_metadata: AuthAdminUserMetadata | null;
  user_metadata: AuthAdminUserMetadata | null;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toMetadataRecord(value: unknown): AuthAdminUserMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AuthAdminUserMetadata;
}

function normalizeProfileRole(value: unknown): string {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "admin" || normalized === "owner_admin") return "customer";
  if (PROFILE_ROLE_SET.has(normalized)) return normalized;
  return "customer";
}

function normalizeProfileLocale(value: unknown): "vi" | "en" {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (PROFILE_LOCALE_SET.has(normalized)) {
    return normalized as "vi" | "en";
  }
  return "vi";
}

function appendWarning(current: string | null, next: string | null | undefined): string | null {
  if (!next) return current;
  if (!current) return next;
  return `${current}; ${next}`;
}

async function upsertProfileFromAuthUser(
  serviceRoleClient: SupabaseClient,
  authUser: AuthAdminUserForProfileSync
): Promise<void> {
  const metadataRole = authUser.app_metadata?.role ?? authUser.user_metadata?.role;
  const metadataLocale = authUser.user_metadata?.locale;
  const metadataFullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name;
  const metadataPhone = authUser.user_metadata?.phone;

  const profilePayload = {
    id: authUser.id,
    full_name: sanitizeText(typeof metadataFullName === "string" ? metadataFullName : null),
    email: sanitizeText(authUser.email)?.toLowerCase() ?? null,
    phone:
      sanitizeText(authUser.phone) ??
      sanitizeText(typeof metadataPhone === "string" ? metadataPhone : null),
    role: normalizeProfileRole(metadataRole),
    locale: normalizeProfileLocale(metadataLocale),
    is_active: true,
    disabled_at: null,
    disabled_by: null,
  };

  const { error } = await serviceRoleClient.from("profiles").upsert(profilePayload, {
    onConflict: "id",
  });

  if (error) throw error;
}

async function ensureProfileByUserId(userId: string): Promise<string | null> {
  let serviceRoleClient: SupabaseClient;
  try {
    serviceRoleClient = createServiceRoleClient();
  } catch (error) {
    return error instanceof Error ? error.message : "Missing service role config";
  }

  const { data, error } = await serviceRoleClient.auth.admin.getUserById(userId);
  if (error) {
    return error.message;
  }

  const authUser = data.user;
  if (!authUser?.id) {
    return "Auth user missing for profile bootstrap";
  }

  try {
    await upsertProfileFromAuthUser(serviceRoleClient, {
      id: authUser.id,
      email: authUser.email ?? null,
      phone: authUser.phone ?? null,
      app_metadata: toMetadataRecord(authUser.app_metadata),
      user_metadata: toMetadataRecord(authUser.user_metadata),
    });
    return null;
  } catch (upsertError) {
    return upsertError instanceof Error ? upsertError.message : "Failed to upsert profile";
  }
}

export function createAnonClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createServiceRoleClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing service role config");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createClientWithToken(token: string) {
  return createSupabaseClientWithToken(token);
}

export function buildRedirectUrl(origin: string | null): string | undefined {
  const resolved = resolveSiteUrl(origin);
  return resolved ?? undefined;
}

function mapProfileRowToApiPayload(userId: string, row: ApiProfileRow): ApiAuthUserProfilePayload {
  const defaultBranchId = row.default_branch_id ?? null;
  return {
    id: row.id,
    auth_user_id: userId,
    full_name: row.full_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    role: row.role ?? null,
    branch_id: defaultBranchId,
    default_branch_id: defaultBranchId,
    locale: row.locale ?? null,
    active: row.is_active ?? true,
  };
}

export function isSkippableProfileQueryError(error: PostgrestError | null): boolean {
  if (!error) return false;
  const code = (error.code ?? "").toUpperCase();
  return code === "42P01" || code === "42703" || code.startsWith("PGRST2");
}

export async function fetchCurrentUserProfileContext(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  profile: ApiAuthUserProfilePayload | null;
  branchAccess: ApiProfileBranchAccessRow[];
  warning: string | null;
}> {
  const fetchProfileRow = () =>
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, default_branch_id, locale, is_active")
      .eq("id", userId)
      .maybeSingle<ApiProfileRow>();

  let warning: string | null = null;

  let { data: profileRow, error: profileError } = await fetchProfileRow();
  if (profileError) {
    if (isSkippableProfileQueryError(profileError)) {
      return { profile: null, branchAccess: [], warning: profileError.message };
    }
    throw profileError;
  }

  if (!profileRow) {
    warning = appendWarning(warning, await ensureProfileByUserId(userId));

    const profileRetry = await fetchProfileRow();
    profileRow = profileRetry.data ?? null;
    profileError = profileRetry.error;

    if (profileError) {
      if (isSkippableProfileQueryError(profileError)) {
        return {
          profile: null,
          branchAccess: [],
          warning: appendWarning(warning, profileError.message),
        };
      }
      throw profileError;
    }
  }

  if (!profileRow) {
    return { profile: null, branchAccess: [], warning };
  }

  const { data: branchAccessRows, error: branchAccessError } = await supabase
    .from("profile_branch_access")
    .select("branch_id, is_default")
    .eq("profile_id", userId)
    .eq("is_delete", false)
    .returns<Array<Pick<ApiProfileBranchAccessRow, "branch_id" | "is_default">>>();

  if (branchAccessError) {
    if (isSkippableProfileQueryError(branchAccessError)) {
      return {
        profile: mapProfileRowToApiPayload(userId, profileRow),
        branchAccess: [],
        warning: appendWarning(warning, branchAccessError.message),
      };
    }
    throw branchAccessError;
  }

  const normalizedBranchRows = branchAccessRows ?? [];
  const branchIds = Array.from(
    new Set(
      normalizedBranchRows
        .map((row) => row.branch_id)
        .filter((branchId): branchId is string => typeof branchId === "string" && branchId.length > 0)
    )
  );

  let branchNameById = new Map<string, string>();
  if (branchIds.length > 0) {
    const { data: branchRows, error: branchError } = await supabase
      .from("branches")
      .select("id, name")
      .in("id", branchIds)
      .returns<Array<{ id: string; name: string | null }>>();

    if (branchError) {
      if (isSkippableProfileQueryError(branchError)) {
        warning = appendWarning(warning, branchError.message);
      } else {
        throw branchError;
      }
    } else {
      branchNameById = new Map(
        (branchRows ?? [])
          .filter((row) => typeof row.id === "string" && row.id.length > 0)
          .map((row) => [row.id, row.name?.trim() || row.id])
      );
    }
  }

  return {
    profile: mapProfileRowToApiPayload(userId, profileRow),
    branchAccess: normalizedBranchRows.map((row) => ({
      branch_id: row.branch_id,
      is_default: row.is_default,
      branch_name: branchNameById.get(row.branch_id) ?? null,
    })),
    warning,
  };
}
