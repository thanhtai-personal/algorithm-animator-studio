import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/server/data-access/auth";
import type {
  CustomerAccountProfileDto,
  UpdateCustomerAccountProfilePayload,
} from "@/types/customerAccount";
import { validatePhoneNumber } from "@/utils/validation/phone";

type CustomerAccountDomainErrorCode =
  | "PROFILE_NOT_FOUND"
  | "FORBIDDEN_ROLE"
  | "INVALID_FULL_NAME"
  | "INVALID_EMAIL"
  | "INVALID_PHONE"
  | "EMAIL_IN_USE"
  | "PHONE_IN_USE";

interface CustomerAccountDomainErrorContext {
  field?: "fullName" | "email" | "phone";
  value?: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  locale: string | null;
  is_active: boolean | null;
}

interface CustomerPhoneConflictRow {
  profile_id: string | null;
}

interface ProfilePhoneConflictRow {
  id: string;
  phone: string | null;
}

type MetadataRecord = Record<string, unknown>;

export class CustomerAccountDomainError extends Error {
  readonly code: CustomerAccountDomainErrorCode;
  readonly context: CustomerAccountDomainErrorContext;

  constructor(
    code: CustomerAccountDomainErrorCode,
    context: CustomerAccountDomainErrorContext = {}
  ) {
    super(code);
    this.name = "CustomerAccountDomainError";
    this.code = code;
    this.context = context;
  }
}

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeEmail(value: string | null | undefined): string | null {
  const text = sanitizeText(value);
  return text ? text.toLowerCase() : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLocale(value: string | null | undefined): "vi" | "en" | null {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "vi" || normalized === "en") {
    return normalized;
  }
  return null;
}

function toMetadataRecord(value: unknown): MetadataRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as MetadataRecord) };
}

function mapProfileRow(row: ProfileRow): CustomerAccountProfileDto {
  return {
    id: row.id,
    fullName: row.full_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    role: row.role ?? null,
    locale: normalizeLocale(row.locale),
    isActive: row.is_active ?? true,
  };
}

async function fetchProfileById(
  serviceRoleClient: SupabaseClient,
  profileId: string
): Promise<ProfileRow | null> {
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .select("id, full_name, email, phone, role, locale, is_active")
    .eq("id", profileId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ?? null;
}

async function ensureEmailNotInUse(
  serviceRoleClient: SupabaseClient,
  options: {
    email: string;
    profileId: string;
  }
): Promise<void> {
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .select("id")
    .neq("id", options.profileId)
    .ilike("email", options.email)
    .limit(1)
    .returns<Array<{ id: string }>>();

  if (error) throw error;
  if ((data ?? []).length > 0) {
    throw new CustomerAccountDomainError("EMAIL_IN_USE", {
      field: "email",
      value: options.email,
    });
  }
}

async function ensurePhoneNotInUse(
  serviceRoleClient: SupabaseClient,
  options: {
    phoneNormalized: string;
    profileId: string;
  }
): Promise<void> {
  const { data: customerRows, error: customerError } = await serviceRoleClient
    .from("customers")
    .select("profile_id")
    .eq("phone_normalized", options.phoneNormalized)
    .not("profile_id", "is", null)
    .limit(20)
    .returns<CustomerPhoneConflictRow[]>();

  if (customerError) throw customerError;

  const customerConflict = (customerRows ?? []).some(
    (row) => row.profile_id && row.profile_id !== options.profileId
  );
  if (customerConflict) {
    throw new CustomerAccountDomainError("PHONE_IN_USE", {
      field: "phone",
      value: options.phoneNormalized,
    });
  }

  const { data: profileRows, error: profileError } = await serviceRoleClient
    .from("profiles")
    .select("id, phone")
    .neq("id", options.profileId)
    .not("phone", "is", null)
    .returns<ProfilePhoneConflictRow[]>();

  if (profileError) throw profileError;

  const profileConflict = (profileRows ?? []).some((row) => {
    const value = sanitizeText(row.phone);
    if (!value) return false;
    const normalized = validatePhoneNumber(value, { allowEmpty: true }).normalized;
    return normalized === options.phoneNormalized;
  });

  if (profileConflict) {
    throw new CustomerAccountDomainError("PHONE_IN_USE", {
      field: "phone",
      value: options.phoneNormalized,
    });
  }
}

function isCustomerRole(value: string | null | undefined): boolean {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "customer";
}

export async function getCustomerAccountProfile(
  profileId: string
): Promise<CustomerAccountProfileDto | null> {
  const serviceRoleClient = createServiceRoleClient();
  const profile = await fetchProfileById(serviceRoleClient, profileId);
  if (!profile) return null;
  return mapProfileRow(profile);
}

export async function updateCustomerAccountProfile(options: {
  profileId: string;
  payload: UpdateCustomerAccountProfilePayload;
}): Promise<CustomerAccountProfileDto> {
  const serviceRoleClient = createServiceRoleClient();
  const profile = await fetchProfileById(serviceRoleClient, options.profileId);
  if (!profile) {
    throw new CustomerAccountDomainError("PROFILE_NOT_FOUND");
  }

  if (!isCustomerRole(profile.role)) {
    throw new CustomerAccountDomainError("FORBIDDEN_ROLE");
  }

  const hasFullName = Object.prototype.hasOwnProperty.call(options.payload, "fullName");
  const hasEmail = Object.prototype.hasOwnProperty.call(options.payload, "email");
  const hasPhone = Object.prototype.hasOwnProperty.call(options.payload, "phone");

  const nextFullName = hasFullName
    ? sanitizeText(options.payload.fullName)
    : profile.full_name;
  if (hasFullName && !nextFullName) {
    throw new CustomerAccountDomainError("INVALID_FULL_NAME", {
      field: "fullName",
      value: options.payload.fullName ?? null,
    });
  }

  const nextEmail = hasEmail ? sanitizeEmail(options.payload.email) : profile.email;
  if (hasEmail) {
    if (!nextEmail || !isValidEmail(nextEmail)) {
      throw new CustomerAccountDomainError("INVALID_EMAIL", {
        field: "email",
        value: options.payload.email ?? null,
      });
    }
  }

  let nextPhone = profile.phone;
  let nextPhoneNormalized: string | null = null;
  if (hasPhone) {
    const phone = sanitizeText(options.payload.phone);
    if (!phone) {
      throw new CustomerAccountDomainError("INVALID_PHONE", {
        field: "phone",
        value: options.payload.phone ?? null,
      });
    }

    const validation = validatePhoneNumber(phone, { allowEmpty: false });
    if (!validation.isValid || !validation.normalized) {
      throw new CustomerAccountDomainError("INVALID_PHONE", {
        field: "phone",
        value: options.payload.phone ?? null,
      });
    }

    nextPhone = validation.normalized;
    nextPhoneNormalized = validation.normalized;
  }

  if (hasEmail && nextEmail && nextEmail !== (profile.email ?? null)) {
    await ensureEmailNotInUse(serviceRoleClient, {
      email: nextEmail,
      profileId: options.profileId,
    });
  }

  if (hasPhone && nextPhoneNormalized) {
    const currentPhoneNormalized = validatePhoneNumber(profile.phone ?? "", {
      allowEmpty: true,
    }).normalized;

    if (nextPhoneNormalized !== currentPhoneNormalized) {
      await ensurePhoneNotInUse(serviceRoleClient, {
        phoneNormalized: nextPhoneNormalized,
        profileId: options.profileId,
      });
    }
  }

  const profilePatch: Record<string, unknown> = {};
  if (hasFullName && nextFullName !== profile.full_name) {
    profilePatch.full_name = nextFullName;
  }
  if (hasEmail && nextEmail !== profile.email) {
    profilePatch.email = nextEmail;
  }
  if (hasPhone && nextPhone !== profile.phone) {
    profilePatch.phone = nextPhone;
  }

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await serviceRoleClient
      .from("profiles")
      .update(profilePatch)
      .eq("id", options.profileId);
    if (error) {
      if (error.code === "23505") {
        throw new CustomerAccountDomainError("EMAIL_IN_USE", {
          field: "email",
          value: nextEmail,
        });
      }
      throw error;
    }
  }

  if (hasFullName || hasPhone) {
    const customerPatch: Record<string, unknown> = {
      updated_by: options.profileId,
    };

    if (hasFullName) {
      customerPatch.full_name = nextFullName;
    }

    if (hasPhone) {
      customerPatch.phone = nextPhone;
      customerPatch.phone_normalized = nextPhoneNormalized;
    }

    const { error } = await serviceRoleClient
      .from("customers")
      .update(customerPatch)
      .eq("profile_id", options.profileId);
    if (error) throw error;
  }

  const { data: authUserData, error: authUserError } =
    await serviceRoleClient.auth.admin.getUserById(options.profileId);
  if (authUserError || !authUserData.user) {
    throw authUserError ?? new Error("AUTH_USER_NOT_FOUND");
  }

  const userMetadata = toMetadataRecord(authUserData.user.user_metadata);
  const authPatch: {
    email?: string;
    email_confirm?: boolean;
    user_metadata?: MetadataRecord;
  } = {};

  if (hasEmail && nextEmail && nextEmail !== sanitizeEmail(authUserData.user.email ?? null)) {
    authPatch.email = nextEmail;
    authPatch.email_confirm = true;
  }

  if (hasFullName || hasPhone) {
    if (hasFullName) {
      userMetadata.full_name = nextFullName;
      userMetadata.name = nextFullName;
    }
    if (hasPhone) {
      userMetadata.phone = nextPhone;
    }
    authPatch.user_metadata = userMetadata;
  }

  if (Object.keys(authPatch).length > 0) {
    const { error: authUpdateError } = await serviceRoleClient.auth.admin.updateUserById(
      options.profileId,
      authPatch
    );
    if (authUpdateError) {
      const message = authUpdateError.message.toLowerCase();
      if (message.includes("already") && message.includes("email")) {
        throw new CustomerAccountDomainError("EMAIL_IN_USE", {
          field: "email",
          value: nextEmail,
        });
      }
      throw authUpdateError;
    }
  }

  const updatedProfile = await fetchProfileById(serviceRoleClient, options.profileId);
  if (!updatedProfile) {
    throw new CustomerAccountDomainError("PROFILE_NOT_FOUND");
  }

  return mapProfileRow(updatedProfile);
}
