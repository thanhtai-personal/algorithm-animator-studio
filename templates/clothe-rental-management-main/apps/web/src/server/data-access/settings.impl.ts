import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SITE_LOGO_DARK_URL,
  DEFAULT_SITE_LOGO_URL,
} from "@/features/branding/constants";
import { isEmailSenderEnabled } from "@/server/config/emailSenderConfig";
import type {
  LateFeeMode,
  PublicSiteBrandingDto,
  PublicShowroomPageConfigDto,
  PublicShowroomPageConfigQuery,
  SettingLocale,
  SettingsBranchDto,
  SettingsBranchPolicyDto,
  SettingsBranchesResponse,
  SettingsCreateBranchPayload,
  SettingsCreateProductCategoryPayload,
  SettingsCreateShowroomPayload,
  SettingsCreateUserPayload,
  SettingsCustomerTagDto,
  SettingsCustomerTagInput,
  SettingsGeneralQuery,
  SettingsGeneralResponse,
  SettingsManagedProductCategoryDto,
  SettingsGeneralUpdatePayload,
  SettingsOpeningHourDto,
  SettingsProductCategoryDto,
  SettingsProductCategoriesQuery,
  SettingsProductCategoriesResponse,
  SettingsProductCategoryInput,
  SettingsResetUserPasswordPayload,
  SettingsShowroomPageConfigDto,
  SettingsShowroomFeaturedProductOptionDto,
  SettingsShowroomPagesQuery,
  SettingsShowroomPagesResponse,
  SettingsShowroomPagesUpdatePayload,
  SettingsShowroomTemplateDto,
  SettingsShowroomDto,
  SettingsShowroomsResponse,
  SettingsSystemDefaultsDto,
  SettingsUpdateBranchPayload,
  SettingsUpdateProductCategoryPayload,
  SettingsUpdateShowroomPayload,
  SettingsUpdateUserPayload,
  SettingsUserRowDto,
  SettingsUsersQuery,
  SettingsUsersResponse,
} from "@/types/settingsModule";
import type { ShowroomRole } from "@/types/showroomAuth";

const SHOWROOM_ROLE_SET = new Set<string>([
  "owner_admin",
  "manager",
  "staff",
  "accountant",
  "makeup_artist",
  "customer",
]);
const OWNER_ADMIN_ROLE = "owner_admin";
const ADMIN_ROLE = "admin";
const MANAGER_ROLE = "manager";
const PRODUCT_CATALOG_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);

const LOCALE_SET = new Set<SettingLocale>(["vi", "en"]);
const LATE_FEE_MODE_SET = new Set<LateFeeMode>(["fixed_per_day", "percent_per_day"]);

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
const DEFAULT_CURRENCY_CODE = "VND";

const DEFAULT_SYSTEM_SETTINGS: SettingsSystemDefaultsDto = {
  defaultLocale: "vi",
  defaultCurrencyCode: DEFAULT_CURRENCY_CODE,
  lateFeeMode: "fixed_per_day",
  lateFeeValue: 0,
  laundryTrackingEnabled: true,
  isShippingModuleEnabled: false,
  isMakeupModuleEnabled: true,
  isZaloMiniAppEnabled: false,
  siteLogoUrl: null,
  siteLogoDarkUrl: null,
  updatedAt: null,
};

type SettingsDomainErrorCode =
  | "FORBIDDEN_SETTINGS_ACCESS"
  | "FORBIDDEN_BRANCH_SCOPE"
  | "MISSING_BRANCH_CONTEXT"
  | "EMAIL_SENDER_DISABLED"
  | "INVALID_CREATE_PASSWORD"
  | "INVALID_RESET_PASSWORD"
  | "INVALID_LOCALE"
  | "INVALID_CURRENCY_CODE"
  | "INVALID_LATE_FEE_MODE"
  | "INVALID_NON_NEGATIVE_NUMBER"
  | "INVALID_OPENING_HOURS"
  | "INVALID_ROLE"
  | "OWNER_ADMIN_ROLE_IS_SEED_ONLY"
  | "OWNER_ADMIN_ROLE_IMMUTABLE"
  | "INVALID_BRANCH_ASSIGNMENT"
  | "BRANCH_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "CANNOT_DISABLE_SELF"
  | "PROFILE_EMAIL_MISSING"
  | "TEMPLATE_NOT_FOUND"
  | "TEMPLATE_INACTIVE"
  | "SHOWROOM_NOT_FOUND"
  | "SHOWROOM_DEFAULT_IMMUTABLE"
  | "SHOWROOM_NAME_REQUIRED"
  | "SHOWROOM_SLUG_REQUIRED"
  | "SHOWROOM_SLUG_INVALID"
  | "SHOWROOM_SLUG_DUPLICATE"
  | "SHOWROOM_IN_USE"
  | "PRODUCT_CATEGORY_NOT_FOUND"
  | "PRODUCT_CATEGORY_CODE_DUPLICATE"
  | "PRODUCT_CATEGORY_IN_USE"
  | "INVALID_PRODUCT_CATEGORY"
  | "INVALID_CUSTOMER_TAG";

interface SettingsDomainErrorContext {
  [key: string]: unknown;
}

export class SettingsDomainError extends Error {
  readonly code: SettingsDomainErrorCode;
  readonly context: SettingsDomainErrorContext;

  constructor(code: SettingsDomainErrorCode, context: SettingsDomainErrorContext = {}) {
    super(code);
    this.name = "SettingsDomainError";
    this.code = code;
    this.context = context;
  }
}

interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
  is_active: boolean;
}

interface ProfileBranchAccessRow {
  profile_id?: string;
  branch_id: string;
  is_default?: boolean;
}

interface BranchRow {
  id: string;
  code: string;
  name: string;
  shop_domain?: string | null;
  address: string | null;
  phone: string | null;
  timezone: string | null;
  currency_code: string | null;
  is_active: boolean;
}

interface SystemSettingsRow {
  id: string;
  default_locale: string;
  default_currency_code: string;
  late_fee_mode: string;
  late_fee_value: number | string | null;
  laundry_tracking_enabled: boolean;
  is_shipping_module_enabled: boolean | null;
  is_makeup_module_enabled: boolean | null;
  is_zalo_mini_app_enabled: boolean | null;
  site_logo_url: string | null;
  site_logo_dark_url: string | null;
  updated_at: string;
}

interface BranchSettingsRow {
  id: string;
  branch_id: string;
  locale: string | null;
  currency_code: string | null;
  late_fee_mode: string | null;
  late_fee_value: number | string | null;
  laundry_tracking_enabled: boolean | null;
  is_rental_module_enabled: boolean | null;
  is_makeup_module_enabled: boolean | null;
  overdue_reminder_threshold_hours: number | null;
  laundry_stuck_threshold_days: number | null;
  updated_at: string;
}

interface BranchOpeningHoursRow {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
}

interface ProductCategoryRow {
  id: string;
  branch_id: string | null;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface FeaturedProductOptionRow {
  id: string;
  product_code: string;
  name: string;
  cover_image_path: string | null;
  gallery_image_paths?: string[] | null;
  category_id: string | null;
  rent_price_per_day: number | string | null;
  quick_rent_price?: number | string | null;
}

interface CustomerTagRow {
  id: string;
  branch_id: string;
  code: string;
  name: string;
  color: string | null;
  is_system: boolean;
  warn_on_order_create: boolean;
  block_order_create: boolean;
  is_active: boolean;
}

interface ShowroomRow {
  id: string;
  name: string;
  slug: string;
  branch_id: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ShowroomPageTemplateRow {
  id: string;
  code: string;
  page_key: string;
  name: string;
  description: string | null;
  preview_image_path: string | null;
  template_version: number;
  is_active: boolean;
  is_default: boolean;
}

interface ShowroomPageConfigRow {
  id: string;
  branch_id: string;
  locale: string;
  page_key: string;
  template_id: string;
  title: string | null;
  subtitle: string | null;
  hero_image_path: string | null;
  hero_config_json: unknown;
  sections_config_json: unknown;
  filters_config_json: unknown;
  seo_config_json: unknown;
  display_config_json: unknown;
  is_active: boolean;
  is_published: boolean;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  default_branch_id: string | null;
  locale: string;
  is_active: boolean;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileIdRow {
  id: string;
}

interface AuthAdminListUserResponse {
  users?: unknown[];
}

interface AuthAdminUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  app_metadata: Record<string, unknown> | null;
  user_metadata: Record<string, unknown> | null;
  is_anonymous: boolean;
}

const AUTH_ADMIN_LIST_PAGE_SIZE = 200;
const BULK_QUERY_CHUNK_SIZE = 200;

interface SettingsContext {
  actor: ProfileActorRow;
  allowedBranchIds: string[];
}

interface PublicShowroomContext {
  showroomId: string;
  showroomSlug: string;
  showroomName: string;
  isDefaultShowroom: boolean;
  branchId: string;
}

function sanitizeEmail(value: string | null | undefined): string | null {
  const text = sanitizeText(value);
  return text ? text.toLowerCase() : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeAuthRole(value: unknown): ShowroomRole {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (text === "admin" || text === OWNER_ADMIN_ROLE) return "customer";
  const normalizedRole = normalizeShowroomRole(text);
  if (normalizedRole === OWNER_ADMIN_ROLE) return "customer";
  return normalizedRole ?? "customer";
}

function normalizeAuthLocale(value: unknown): SettingLocale {
  if (typeof value !== "string") return "vi";
  return normalizeLocale(value) ?? "vi";
}

function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isMissingOptionalSystemSettingsColumnsError(error: unknown): boolean {
  const row = toRecord(error);
  if (!row) return false;

  const code = typeof row.code === "string" ? row.code : "";
  const message = typeof row.message === "string" ? row.message : "";
  const details = typeof row.details === "string" ? row.details : "";
  const hint = typeof row.hint === "string" ? row.hint : "";

  const combined = `${message} ${details} ${hint}`.toLowerCase();
  const mentionsOptionalColumns =
    combined.includes("site_logo_url") ||
    combined.includes("site_logo_dark_url") ||
    combined.includes("is_shipping_module_enabled") ||
    combined.includes("is_makeup_module_enabled") ||
    combined.includes("is_zalo_mini_app_enabled");

  if (!mentionsOptionalColumns) return false;
  if (code === "42703" || code === "PGRST204") return true;

  return (
    combined.includes("does not exist") ||
    combined.includes("schema cache") ||
    combined.includes("could not find")
  );
}

function toAuthAdminUserRow(value: unknown): AuthAdminUserRow | null {
  const row = toRecord(value);
  if (!row) return null;

  const id = sanitizeText(typeof row.id === "string" ? row.id : null);
  if (!id) return null;

  const appMetadata = toRecord(row.app_metadata);
  const userMetadata = toRecord(row.user_metadata);

  return {
    id,
    email: sanitizeEmail(typeof row.email === "string" ? row.email : null),
    phone: sanitizeText(typeof row.phone === "string" ? row.phone : null),
    app_metadata: appMetadata,
    user_metadata: userMetadata,
    is_anonymous: Boolean(row.is_anonymous),
  };
}

async function fetchAuthUsers(serviceRoleClient: SupabaseClient): Promise<AuthAdminUserRow[]> {
  const rows: AuthAdminUserRow[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await serviceRoleClient.auth.admin.listUsers({
      page,
      perPage: AUTH_ADMIN_LIST_PAGE_SIZE,
    });

    if (error) throw error;

    const payload = (data ?? null) as AuthAdminListUserResponse | null;
    const users = payload?.users ?? [];

    for (const user of users) {
      const mapped = toAuthAdminUserRow(user);
      if (!mapped || mapped.is_anonymous) continue;
      rows.push(mapped);
    }

    if (users.length < AUTH_ADMIN_LIST_PAGE_SIZE) break;
    page += 1;
  }

  return rows;
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  const row = toRecord(error);
  if (!row) return false;

  const code = typeof row.code === "string" ? row.code : "";
  const message = typeof row.message === "string" ? row.message : "";
  const details = typeof row.details === "string" ? row.details : "";
  const hint = typeof row.hint === "string" ? row.hint : "";
  const haystack = `${message} ${details} ${hint}`.toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  if (!haystack.includes(normalizedColumn)) return false;

  return (
    code === "42703" ||
    code === "PGRST204" ||
    haystack.includes("does not exist") ||
    haystack.includes("schema cache") ||
    haystack.includes("could not find")
  );
}

function isMissingBranchPolicyOptionalColumnsError(error: unknown): boolean {
  const row = toRecord(error);
  if (!row) return false;

  const code = typeof row.code === "string" ? row.code : "";
  const message = typeof row.message === "string" ? row.message : "";
  const details = typeof row.details === "string" ? row.details : "";
  const hint = typeof row.hint === "string" ? row.hint : "";
  const combined = `${message} ${details} ${hint}`.toLowerCase();
  const missingOptionalColumns =
    combined.includes("overdue_reminder_threshold_hours") ||
    combined.includes("laundry_stuck_threshold_days") ||
    combined.includes("is_rental_module_enabled") ||
    combined.includes("is_makeup_module_enabled");

  if (!missingOptionalColumns) return false;
  if (code === "42703" || code === "PGRST204") return true;

  return (
    combined.includes("does not exist") ||
    combined.includes("schema cache") ||
    combined.includes("could not find")
  );
}

function isAuthAdminUserNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { message?: unknown; code?: unknown; status?: unknown };
  const message =
    typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  const code = typeof candidate.code === "string" ? candidate.code.toUpperCase() : "";
  const status =
    typeof candidate.status === "number" ? candidate.status : Number(candidate.status ?? NaN);

  return (
    code === "USER_NOT_FOUND" ||
    status === 404 ||
    message.includes("user not found") ||
    message.includes("no user found")
  );
}

async function resolveAuthUserIdFromProfile(options: {
  serviceRoleClient: SupabaseClient;
  profileId: string;
  profileEmail: string | null;
}): Promise<string | null> {
  const directLookup = await options.serviceRoleClient.auth.admin.getUserById(options.profileId);
  if (!directLookup.error && directLookup.data.user?.id) {
    return directLookup.data.user.id;
  }

  if (directLookup.error && !isAuthAdminUserNotFoundError(directLookup.error)) {
    throw directLookup.error;
  }

  const normalizedEmail = sanitizeEmail(options.profileEmail);
  if (!normalizedEmail) return null;

  const authUsers = await fetchAuthUsers(options.serviceRoleClient);
  const matched = authUsers.find((entry) => sanitizeEmail(entry.email) === normalizedEmail);
  return matched?.id ?? null;
}

function chunkValues<T>(values: T[], chunkSize: number): T[][] {
  if (values.length === 0) return [];

  const output: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    output.push(values.slice(index, index + chunkSize));
  }
  return output;
}

async function syncMissingProfilesFromAuthUsers(
  supabase: SupabaseClient,
  serviceRoleClient: SupabaseClient
): Promise<void> {
  const authUsers = await fetchAuthUsers(serviceRoleClient);
  if (authUsers.length === 0) return;

  const userIds = authUsers.map((entry) => entry.id);
  const existingIdSet = new Set<string>();

  for (const idChunk of chunkValues(userIds, BULK_QUERY_CHUNK_SIZE)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .in("id", idChunk)
      .returns<ProfileIdRow[]>();

    if (error) throw error;

    for (const row of data ?? []) {
      existingIdSet.add(row.id);
    }
  }

  const missingUsers = authUsers.filter((entry) => !existingIdSet.has(entry.id));
  if (missingUsers.length === 0) return;

  const missingProfileRows = missingUsers.map((entry) => ({
    id: entry.id,
    full_name:
      sanitizeText(typeof entry.user_metadata?.full_name === "string" ? entry.user_metadata.full_name : null) ??
      sanitizeText(typeof entry.user_metadata?.name === "string" ? entry.user_metadata.name : null),
    email: entry.email,
    phone: entry.phone,
    role: normalizeAuthRole(entry.app_metadata?.role),
    locale: normalizeAuthLocale(entry.user_metadata?.locale),
    is_active: true,
    disabled_at: null,
    disabled_by: null,
  }));

  for (const rowChunk of chunkValues(missingProfileRows, BULK_QUERY_CHUNK_SIZE)) {
    const { error } = await supabase.from("profiles").upsert(rowChunk, {
      onConflict: "id",
    });

    if (error) throw error;
  }
}

function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolvePrimaryProductImagePath(
  coverImagePath: string | null | undefined,
  galleryImagePaths: Array<string | null | undefined> | null | undefined
): string | null {
  const normalizedCover = sanitizeText(coverImagePath);
  if (normalizedCover) return normalizedCover;

  if (!Array.isArray(galleryImagePaths)) return null;
  for (const entry of galleryImagePaths) {
    const normalized = sanitizeText(entry ?? null);
    if (normalized) return normalized;
  }
  return null;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function normalizeLocale(value: string | null | undefined): SettingLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as SettingLocale;
  if (!LOCALE_SET.has(normalized)) return null;
  return normalized;
}

function normalizeLateFeeMode(value: string | null | undefined): LateFeeMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as LateFeeMode;
  if (!LATE_FEE_MODE_SET.has(normalized)) return null;
  return normalized;
}

function normalizeShowroomRole(value: string | null | undefined): ShowroomRole | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "admin") {
    return "owner_admin";
  }
  if (!SHOWROOM_ROLE_SET.has(normalized)) return null;
  return normalized as ShowroomRole;
}

function normalizeCurrencyCode(value: string | null | undefined): string | null {
  const text = sanitizeText(value);
  if (!text) return null;
  if (text.length < 3) return null;
  return text.toUpperCase();
}

function normalizeShowroomSlug(value: string | null | undefined): string | null {
  const text = sanitizeText(value);
  if (!text) return null;

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  return normalized;
}

function normalizeBranchSlug(value: string | null | undefined): string | null {
  return normalizeShowroomSlug(value);
}

function resolveEffectiveBranchShopDomain(options: {
  id: string;
  code: string;
  name: string;
  shopDomain?: string | null;
}): string {
  return (
    normalizeBranchSlug(options.shopDomain ?? null) ??
    normalizeBranchSlug(options.name) ??
    normalizeBranchSlug(options.code) ??
    options.id
  );
}

function resolveShowroomSlug(options: {
  requestedSlug?: string | null;
  fallbackName?: string | null;
}): string {
  const requestedSlug = sanitizeText(options.requestedSlug ?? null);
  if (requestedSlug) {
    const directSlug = normalizeShowroomSlug(requestedSlug);
    if (!directSlug) {
      throw new SettingsDomainError("SHOWROOM_SLUG_INVALID", {
        slug: options.requestedSlug,
      });
    }
    return directSlug;
  }

  const nameBasedSlug = normalizeShowroomSlug(options.fallbackName ?? null);
  if (nameBasedSlug) return nameBasedSlug;

  throw new SettingsDomainError("SHOWROOM_SLUG_REQUIRED");
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  let parsed: number;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string") {
    parsed = Number(value);
  } else {
    return null;
  }

  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function isOwnerAdminRole(role: string | null | undefined): boolean {
  const normalizedRole = sanitizeText(role)?.toLowerCase() ?? null;
  if (!normalizedRole) return false;
  return normalizedRole === OWNER_ADMIN_ROLE || normalizedRole === ADMIN_ROLE;
}

function isManagerRole(role: string | null | undefined): boolean {
  const normalizedRole = sanitizeText(role)?.toLowerCase() ?? null;
  if (!normalizedRole) return false;
  return normalizedRole === MANAGER_ROLE;
}

function isSettingsBranchScopedRole(role: string | null | undefined): boolean {
  return isOwnerAdminRole(role) || isManagerRole(role);
}

function isProductCatalogRole(role: string | null | undefined): boolean {
  const normalizedRole = sanitizeText(role)?.toLowerCase() ?? null;
  if (!normalizedRole) return false;
  return PRODUCT_CATALOG_ROLE_SET.has(normalizedRole);
}

function normalizeTimeValue(value: string | null | undefined): string | null {
  const text = sanitizeText(value);
  if (!text) return null;
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(text)) return null;
  if (text.length === 5) return `${text}:00`;
  return text;
}

function assertTimeOrder(start: string | null, end: string | null, code: SettingsDomainErrorCode): void {
  if (!start || !end) return;
  if (start >= end) {
    throw new SettingsDomainError(code, {
      start,
      end,
    });
  }
}

function ensureOwnerAdmin(context: SettingsContext): void {
  if (!isOwnerAdminRole(context.actor.role)) {
    throw new SettingsDomainError("FORBIDDEN_SETTINGS_ACCESS", {
      role: context.actor.role,
    });
  }
}

function ensureSettingsBranchScopedRole(context: SettingsContext): void {
  if (!isSettingsBranchScopedRole(context.actor.role)) {
    throw new SettingsDomainError("FORBIDDEN_SETTINGS_ACCESS", {
      role: context.actor.role,
    });
  }
}

function ensureProductCatalogRole(context: SettingsContext): void {
  if (!isProductCatalogRole(context.actor.role)) {
    throw new SettingsDomainError("FORBIDDEN_SETTINGS_ACCESS", {
      role: context.actor.role,
    });
  }
}

async function fetchActorProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileActorRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, default_branch_id, is_active")
    .eq("id", profileId)
    .maybeSingle<ProfileActorRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchActorBranchAccessIds(
  supabase: SupabaseClient,
  actorProfileId: string,
  defaultBranchId: string | null
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profile_branch_access")
    .select("branch_id")
    .eq("profile_id", actorProfileId)
    .eq("is_delete", false)
    .returns<ProfileBranchAccessRow[]>();

  if (error) throw error;

  const allowed = new Set((data ?? []).map((entry) => entry.branch_id));
  if (defaultBranchId) {
    allowed.add(defaultBranchId);
  }

  return Array.from(allowed);
}

async function resolveSettingsContext(
  supabase: SupabaseClient,
  actorProfileId: string
): Promise<SettingsContext> {
  const actor = await fetchActorProfile(supabase, actorProfileId);
  if (!actor || !actor.is_active) {
    throw new SettingsDomainError("FORBIDDEN_SETTINGS_ACCESS", {
      reason: "missing-or-inactive-actor",
    });
  }

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id
  );

  return {
    actor,
    allowedBranchIds,
  };
}

function resolveBranchId(options: {
  requestedBranchId: string | null;
  context: SettingsContext;
}): string {
  const requestedBranchId = options.requestedBranchId;

  if (requestedBranchId) {
    if (!options.context.allowedBranchIds.includes(requestedBranchId)) {
      throw new SettingsDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
      });
    }

    return requestedBranchId;
  }

  const fallback =
    options.context.actor.default_branch_id ?? options.context.allowedBranchIds[0] ?? null;

  if (!fallback) {
    throw new SettingsDomainError("MISSING_BRANCH_CONTEXT", {
      role: options.context.actor.role,
    });
  }

  return fallback;
}

function mapBranchRow(row: BranchRow): SettingsBranchDto {
  const shopDomain = resolveEffectiveBranchShopDomain({
    id: row.id,
    code: row.code,
    name: row.name,
    shopDomain: row.shop_domain,
  });

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    shopDomain,
    address: row.address,
    phone: row.phone,
    timezone: sanitizeText(row.timezone) ?? DEFAULT_TIMEZONE,
    currencyCode: normalizeCurrencyCode(row.currency_code) ?? DEFAULT_CURRENCY_CODE,
    isActive: row.is_active,
  };
}

function mapShowroomRow(options: {
  row: ShowroomRow;
  branchById: Map<string, SettingsBranchDto>;
}): SettingsShowroomDto {
  const branch = options.branchById.get(options.row.branch_id);

  return {
    id: options.row.id,
    name: options.row.name,
    slug: options.row.slug,
    branchId: options.row.branch_id,
    branchCode: branch?.code ?? "",
    branchName: branch?.name ?? "",
    isDefault: options.row.is_default,
    isActive: options.row.is_active,
    createdAt: options.row.created_at,
    updatedAt: options.row.updated_at,
  };
}

function mapManagedProductCategoryRow(options: {
  row: ProductCategoryRow;
  productCount: number;
}): SettingsManagedProductCategoryDto {
  return {
    id: options.row.id,
    branchId: options.row.branch_id,
    code: options.row.code,
    name: options.row.name,
    sortOrder:
      typeof options.row.sort_order === "number" && Number.isFinite(options.row.sort_order)
        ? Math.floor(options.row.sort_order)
        : 0,
    isActive: options.row.is_active,
    isSystem: options.row.branch_id === null,
    productCount: Math.max(0, Math.floor(options.productCount)),
  };
}

async function getProductCategoryById(
  supabase: SupabaseClient,
  productCategoryId: string
): Promise<ProductCategoryRow | null> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, branch_id, code, name, sort_order, is_active")
    .eq("id", productCategoryId)
    .maybeSingle<ProductCategoryRow>();

  if (error) throw error;
  return data ?? null;
}

async function ensureProductCategoryCodeUnique(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    code: string;
    excludeProductCategoryId?: string;
  }
): Promise<void> {
  let query = supabase
    .from("product_categories")
    .select("id")
    .eq("branch_id", options.branchId)
    .ilike("code", options.code)
    .limit(1);

  if (options.excludeProductCategoryId) {
    query = query.neq("id", options.excludeProductCategoryId);
  }

  const { data, error } = await query.returns<Array<{ id: string }>>();
  if (error) throw error;

  if ((data ?? []).length > 0) {
    throw new SettingsDomainError("PRODUCT_CATEGORY_CODE_DUPLICATE", {
      code: options.code,
      branchId: options.branchId,
    });
  }
}

async function fetchProductCountByProductCategoryIds(
  supabase: SupabaseClient,
  productCategoryIds: string[]
): Promise<Map<string, number>> {
  const output = new Map<string, number>();
  if (productCategoryIds.length === 0) return output;

  for (const productCategoryId of productCategoryIds) {
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", productCategoryId);

    if (error) throw error;
    output.set(productCategoryId, Math.max(0, count ?? 0));
  }

  return output;
}

async function getShowroomById(
  supabase: SupabaseClient,
  showroomId: string
): Promise<ShowroomRow | null> {
  const { data, error } = await supabase
    .from("showrooms")
    .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
    .eq("id", showroomId)
    .maybeSingle<ShowroomRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchAccessibleBranches(
  supabase: SupabaseClient,
  options: {
    context: SettingsContext;
  }
): Promise<SettingsBranchDto[]> {
  let query = supabase
    .from("branches")
    .select("id, code, name, address, phone, timezone, currency_code, is_active")
    .order("code", { ascending: true });

  if (!isOwnerAdminRole(options.context.actor.role)) {
    query = query.in("id", options.context.allowedBranchIds);
  }

  const { data, error } = await query.returns<BranchRow[]>();
  if (error) throw error;

  return (data ?? []).map(mapBranchRow);
}

async function ensureBranchExists(
  supabase: SupabaseClient,
  branchId: string
): Promise<SettingsBranchDto> {
  const { data, error } = await supabase
    .from("branches")
    .select("id, code, name, address, phone, timezone, currency_code, is_active")
    .eq("id", branchId)
    .maybeSingle<BranchRow>();

  if (error) throw error;
  if (!data) {
    throw new SettingsDomainError("BRANCH_NOT_FOUND", {
      branchId,
    });
  }

  return mapBranchRow(data);
}

async function fetchSystemSettings(
  supabase: SupabaseClient
): Promise<SettingsSystemDefaultsDto> {
  let data: SystemSettingsRow | null = null;

  const withLogoColumnsResult = await supabase
    .from("system_settings")
    .select(
      "id, default_locale, default_currency_code, late_fee_mode, late_fee_value, laundry_tracking_enabled, is_shipping_module_enabled, is_makeup_module_enabled, is_zalo_mini_app_enabled, site_logo_url, site_logo_dark_url, updated_at"
    )
    .limit(1)
    .maybeSingle<SystemSettingsRow>();

  if (withLogoColumnsResult.error) {
    if (!isMissingOptionalSystemSettingsColumnsError(withLogoColumnsResult.error)) {
      throw withLogoColumnsResult.error;
    }

    const legacyResult = await supabase
      .from("system_settings")
      .select(
        "id, default_locale, default_currency_code, late_fee_mode, late_fee_value, laundry_tracking_enabled, updated_at"
      )
      .limit(1)
      .maybeSingle<
        Pick<
          SystemSettingsRow,
          | "id"
          | "default_locale"
          | "default_currency_code"
          | "late_fee_mode"
          | "late_fee_value"
          | "laundry_tracking_enabled"
          | "updated_at"
        >
      >();

    if (legacyResult.error) throw legacyResult.error;

    if (legacyResult.data) {
      data = {
        ...legacyResult.data,
        is_shipping_module_enabled: false,
        is_makeup_module_enabled: DEFAULT_SYSTEM_SETTINGS.isMakeupModuleEnabled,
        is_zalo_mini_app_enabled: DEFAULT_SYSTEM_SETTINGS.isZaloMiniAppEnabled,
        site_logo_url: null,
        site_logo_dark_url: null,
      };
    }
  } else {
    data = withLogoColumnsResult.data ?? null;
  }

  if (!data) return { ...DEFAULT_SYSTEM_SETTINGS };

  return {
    defaultLocale: normalizeLocale(data.default_locale) ?? DEFAULT_SYSTEM_SETTINGS.defaultLocale,
    defaultCurrencyCode:
      normalizeCurrencyCode(data.default_currency_code) ?? DEFAULT_SYSTEM_SETTINGS.defaultCurrencyCode,
    lateFeeMode: normalizeLateFeeMode(data.late_fee_mode) ?? DEFAULT_SYSTEM_SETTINGS.lateFeeMode,
    lateFeeValue: roundMoney(Math.max(0, parseNumeric(data.late_fee_value))),
    laundryTrackingEnabled: data.laundry_tracking_enabled,
    isShippingModuleEnabled:
      data.is_shipping_module_enabled ?? DEFAULT_SYSTEM_SETTINGS.isShippingModuleEnabled,
    isMakeupModuleEnabled:
      data.is_makeup_module_enabled ?? DEFAULT_SYSTEM_SETTINGS.isMakeupModuleEnabled,
    isZaloMiniAppEnabled:
      data.is_zalo_mini_app_enabled ?? DEFAULT_SYSTEM_SETTINGS.isZaloMiniAppEnabled,
    siteLogoUrl: sanitizeText(data.site_logo_url ?? null),
    siteLogoDarkUrl: sanitizeText(data.site_logo_dark_url ?? null),
    updatedAt: data.updated_at,
  };
}

async function fetchBranchPolicy(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    systemDefaults: SettingsSystemDefaultsDto;
  }
): Promise<SettingsBranchPolicyDto> {
  let data: BranchSettingsRow | null = null;

  const withOptionalColumnsResult = await supabase
    .from("branch_settings")
    .select(
      "id, branch_id, locale, currency_code, late_fee_mode, late_fee_value, laundry_tracking_enabled, is_rental_module_enabled, is_makeup_module_enabled, overdue_reminder_threshold_hours, laundry_stuck_threshold_days, updated_at"
    )
    .eq("branch_id", options.branchId)
    .maybeSingle<BranchSettingsRow>();

  if (withOptionalColumnsResult.error) {
    if (!isMissingBranchPolicyOptionalColumnsError(withOptionalColumnsResult.error)) {
      throw withOptionalColumnsResult.error;
    }

    const legacyResult = await supabase
      .from("branch_settings")
      .select(
        "id, branch_id, locale, currency_code, late_fee_mode, late_fee_value, laundry_tracking_enabled, updated_at"
      )
      .eq("branch_id", options.branchId)
      .maybeSingle<
        Pick<
          BranchSettingsRow,
          | "id"
          | "branch_id"
          | "locale"
          | "currency_code"
          | "late_fee_mode"
          | "late_fee_value"
          | "laundry_tracking_enabled"
          | "updated_at"
        >
      >();

    if (legacyResult.error) throw legacyResult.error;
    data = legacyResult.data
      ? {
          ...legacyResult.data,
          is_rental_module_enabled: true,
          is_makeup_module_enabled: true,
          overdue_reminder_threshold_hours: null,
          laundry_stuck_threshold_days: null,
        }
      : null;
  } else {
    data = withOptionalColumnsResult.data ?? null;
  }

  return {
    branchId: options.branchId,
    locale: normalizeLocale(data?.locale) ?? options.systemDefaults.defaultLocale,
    currencyCode:
      normalizeCurrencyCode(data?.currency_code) ?? options.systemDefaults.defaultCurrencyCode,
    lateFeeMode: normalizeLateFeeMode(data?.late_fee_mode) ?? options.systemDefaults.lateFeeMode,
    lateFeeValue:
      data?.late_fee_value !== null && data?.late_fee_value !== undefined
        ? roundMoney(Math.max(0, parseNumeric(data.late_fee_value)))
        : options.systemDefaults.lateFeeValue,
    laundryTrackingEnabled:
      data?.laundry_tracking_enabled === null || data?.laundry_tracking_enabled === undefined
        ? options.systemDefaults.laundryTrackingEnabled
        : data.laundry_tracking_enabled,
    isRentalModuleEnabled:
      data?.is_rental_module_enabled === null || data?.is_rental_module_enabled === undefined
        ? true
        : data.is_rental_module_enabled,
    isMakeupModuleEnabled:
      data?.is_makeup_module_enabled === null || data?.is_makeup_module_enabled === undefined
        ? true
        : data.is_makeup_module_enabled,
    overdueReminderThresholdHours:
      data?.overdue_reminder_threshold_hours === null ||
      data?.overdue_reminder_threshold_hours === undefined
        ? 4
        : Math.max(0, Math.floor(data.overdue_reminder_threshold_hours)),
    laundryStuckThresholdDays:
      data?.laundry_stuck_threshold_days === null ||
      data?.laundry_stuck_threshold_days === undefined
        ? 3
        : Math.max(0, Math.floor(data.laundry_stuck_threshold_days)),
    updatedAt: data?.updated_at ?? null,
  };
}

function buildDefaultOpeningHours(): SettingsOpeningHourDto[] {
  return [
    { dayOfWeek: 0, isOpen: false, openTime: null, closeTime: null, breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 1, isOpen: true, openTime: "09:00:00", closeTime: "20:00:00", breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 2, isOpen: true, openTime: "09:00:00", closeTime: "20:00:00", breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 3, isOpen: true, openTime: "09:00:00", closeTime: "20:00:00", breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 4, isOpen: true, openTime: "09:00:00", closeTime: "20:00:00", breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 5, isOpen: true, openTime: "09:00:00", closeTime: "20:00:00", breakStartTime: null, breakEndTime: null },
    { dayOfWeek: 6, isOpen: true, openTime: "09:00:00", closeTime: "20:00:00", breakStartTime: null, breakEndTime: null },
  ];
}

async function fetchOpeningHours(
  supabase: SupabaseClient,
  branchId: string
): Promise<SettingsOpeningHourDto[]> {
  const { data, error } = await supabase
    .from("branch_opening_hours")
    .select("day_of_week, is_open, open_time, close_time, break_start_time, break_end_time")
    .eq("branch_id", branchId)
    .order("day_of_week", { ascending: true })
    .returns<BranchOpeningHoursRow[]>();

  if (error) throw error;

  const byDay = new Map<number, SettingsOpeningHourDto>();
  for (const row of data ?? []) {
    byDay.set(row.day_of_week, {
      dayOfWeek: row.day_of_week,
      isOpen: row.is_open,
      openTime: row.open_time,
      closeTime: row.close_time,
      breakStartTime: row.break_start_time,
      breakEndTime: row.break_end_time,
    });
  }

  const fallback = buildDefaultOpeningHours();
  return fallback.map((row) => byDay.get(row.dayOfWeek) ?? row);
}

async function fetchProductCategories(
  supabase: SupabaseClient,
  branchId: string
): Promise<SettingsProductCategoryDto[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, branch_id, code, name, sort_order, is_active")
    .or(`branch_id.is.null,branch_id.eq.${branchId}`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<ProductCategoryRow[]>();

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    isActive: row.is_active,
    isSystem: row.branch_id === null,
  }));
}

async function fetchCustomerTags(
  supabase: SupabaseClient,
  branchId: string
): Promise<SettingsCustomerTagDto[]> {
  const { data, error } = await supabase
    .from("customer_tags")
    .select(
      "id, branch_id, code, name, color, is_system, warn_on_order_create, block_order_create, is_active"
    )
    .eq("branch_id", branchId)
    .order("code", { ascending: true })
    .returns<CustomerTagRow[]>();

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    color: row.color,
    isSystem: row.is_system,
    warnOnOrderCreate: row.warn_on_order_create,
    blockOrderCreate: row.block_order_create,
    isActive: row.is_active,
  }));
}

async function buildGeneralSettingsResponse(
  supabase: SupabaseClient,
  options: {
    context: SettingsContext;
    branchId: string;
  }
): Promise<SettingsGeneralResponse> {
  const branches = await fetchAccessibleBranches(supabase, {
    context: options.context,
  });

  const [systemDefaults, categories, customerTags, openingHours] = await Promise.all([
    fetchSystemSettings(supabase),
    fetchProductCategories(supabase, options.branchId),
    fetchCustomerTags(supabase, options.branchId),
    fetchOpeningHours(supabase, options.branchId),
  ]);

  const branchPolicy = await fetchBranchPolicy(supabase, {
    branchId: options.branchId,
    systemDefaults,
  });

  return {
    branchId: options.branchId,
    branches,
    systemDefaults,
    branchPolicy,
    openingHours,
    productCategories: categories,
    customerTags,
    selfServicePasswordPath: "/{locale}/auth",
    adminResetPasswordSupported: true,
  };
}

function normalizeOpeningHoursInput(value: SettingsOpeningHourDto[]): SettingsOpeningHourDto[] {
  const seen = new Set<number>();
  const normalized: SettingsOpeningHourDto[] = [];

  for (const row of value) {
    const day = Math.floor(row.dayOfWeek);
    if (day < 0 || day > 6 || seen.has(day)) {
      throw new SettingsDomainError("INVALID_OPENING_HOURS", {
        reason: "invalid-or-duplicate-day",
        dayOfWeek: row.dayOfWeek,
      });
    }

    seen.add(day);

    const isOpen = Boolean(row.isOpen);
    const openTime = normalizeTimeValue(row.openTime);
    const closeTime = normalizeTimeValue(row.closeTime);
    const breakStartTime = normalizeTimeValue(row.breakStartTime);
    const breakEndTime = normalizeTimeValue(row.breakEndTime);

    if (isOpen && (!openTime || !closeTime)) {
      throw new SettingsDomainError("INVALID_OPENING_HOURS", {
        reason: "open-time-required",
        dayOfWeek: day,
      });
    }

    assertTimeOrder(openTime, closeTime, "INVALID_OPENING_HOURS");
    assertTimeOrder(breakStartTime, breakEndTime, "INVALID_OPENING_HOURS");

    normalized.push({
      dayOfWeek: day,
      isOpen,
      openTime: isOpen ? openTime : null,
      closeTime: isOpen ? closeTime : null,
      breakStartTime: isOpen ? breakStartTime : null,
      breakEndTime: isOpen ? breakEndTime : null,
    });
  }

  if (normalized.length !== 7) {
    throw new SettingsDomainError("INVALID_OPENING_HOURS", {
      reason: "missing-day",
      count: normalized.length,
    });
  }

  return normalized.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

async function upsertSystemSettings(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    patch: SettingsGeneralUpdatePayload["systemDefaults"];
  }
): Promise<void> {
  if (!options.patch) return;

  let hasOptionalColumns = true;
  let currentRow: Pick<
    SystemSettingsRow,
    | "id"
    | "default_locale"
    | "default_currency_code"
    | "late_fee_mode"
    | "late_fee_value"
    | "laundry_tracking_enabled"
    | "is_shipping_module_enabled"
    | "is_makeup_module_enabled"
    | "is_zalo_mini_app_enabled"
    | "site_logo_url"
    | "site_logo_dark_url"
  > | null = null;

  const withLogoColumnsResult = await supabase
    .from("system_settings")
    .select(
      "id, default_locale, default_currency_code, late_fee_mode, late_fee_value, laundry_tracking_enabled, is_shipping_module_enabled, is_makeup_module_enabled, is_zalo_mini_app_enabled, site_logo_url, site_logo_dark_url"
    )
    .limit(1)
    .maybeSingle<
      Pick<
        SystemSettingsRow,
        | "id"
        | "default_locale"
        | "default_currency_code"
        | "late_fee_mode"
        | "late_fee_value"
        | "laundry_tracking_enabled"
        | "is_shipping_module_enabled"
        | "is_makeup_module_enabled"
        | "is_zalo_mini_app_enabled"
        | "site_logo_url"
        | "site_logo_dark_url"
      >
    >();

  if (withLogoColumnsResult.error) {
    if (!isMissingOptionalSystemSettingsColumnsError(withLogoColumnsResult.error)) {
      throw withLogoColumnsResult.error;
    }

    hasOptionalColumns = false;

    const legacyResult = await supabase
      .from("system_settings")
      .select(
        "id, default_locale, default_currency_code, late_fee_mode, late_fee_value, laundry_tracking_enabled"
      )
      .limit(1)
      .maybeSingle<
        Pick<
          SystemSettingsRow,
          | "id"
          | "default_locale"
          | "default_currency_code"
          | "late_fee_mode"
          | "late_fee_value"
          | "laundry_tracking_enabled"
        >
      >();

    if (legacyResult.error) throw legacyResult.error;

    currentRow = legacyResult.data
      ? {
          ...legacyResult.data,
          is_shipping_module_enabled: false,
          is_makeup_module_enabled: DEFAULT_SYSTEM_SETTINGS.isMakeupModuleEnabled,
          is_zalo_mini_app_enabled: DEFAULT_SYSTEM_SETTINGS.isZaloMiniAppEnabled,
          site_logo_url: null,
          site_logo_dark_url: null,
        }
      : null;
  } else {
    currentRow = withLogoColumnsResult.data ?? null;
  }

  const defaultLocale =
    options.patch.defaultLocale === undefined
      ? normalizeLocale(currentRow?.default_locale) ?? DEFAULT_SYSTEM_SETTINGS.defaultLocale
      : options.patch.defaultLocale;
  if (!defaultLocale || !LOCALE_SET.has(defaultLocale)) {
    throw new SettingsDomainError("INVALID_LOCALE", {
      defaultLocale: options.patch.defaultLocale,
    });
  }

  const defaultCurrencyCode =
    options.patch.defaultCurrencyCode === undefined
      ? normalizeCurrencyCode(currentRow?.default_currency_code) ??
        DEFAULT_SYSTEM_SETTINGS.defaultCurrencyCode
      : normalizeCurrencyCode(options.patch.defaultCurrencyCode);
  if (!defaultCurrencyCode) {
    throw new SettingsDomainError("INVALID_CURRENCY_CODE", {
      defaultCurrencyCode: options.patch.defaultCurrencyCode,
    });
  }

  const lateFeeMode =
    options.patch.lateFeeMode === undefined
      ? normalizeLateFeeMode(currentRow?.late_fee_mode) ?? DEFAULT_SYSTEM_SETTINGS.lateFeeMode
      : options.patch.lateFeeMode;
  if (!lateFeeMode || !LATE_FEE_MODE_SET.has(lateFeeMode)) {
    throw new SettingsDomainError("INVALID_LATE_FEE_MODE", {
      lateFeeMode: options.patch.lateFeeMode,
    });
  }

  const lateFeeValue =
    options.patch.lateFeeValue === undefined
      ? roundMoney(Math.max(0, parseNumeric(currentRow?.late_fee_value)))
      : parseNonNegativeNumber(options.patch.lateFeeValue);
  if (lateFeeValue === null) {
    throw new SettingsDomainError("INVALID_NON_NEGATIVE_NUMBER", {
      field: "lateFeeValue",
      value: options.patch.lateFeeValue,
    });
  }

  const laundryTrackingEnabled =
    options.patch.laundryTrackingEnabled === undefined
      ? currentRow?.laundry_tracking_enabled ?? DEFAULT_SYSTEM_SETTINGS.laundryTrackingEnabled
      : Boolean(options.patch.laundryTrackingEnabled);
  const isShippingModuleEnabled =
    options.patch.isShippingModuleEnabled === undefined
      ? currentRow?.is_shipping_module_enabled ??
        DEFAULT_SYSTEM_SETTINGS.isShippingModuleEnabled
      : Boolean(options.patch.isShippingModuleEnabled);
  const isMakeupModuleEnabled =
    options.patch.isMakeupModuleEnabled === undefined
      ? currentRow?.is_makeup_module_enabled ?? DEFAULT_SYSTEM_SETTINGS.isMakeupModuleEnabled
      : Boolean(options.patch.isMakeupModuleEnabled);
  const isZaloMiniAppEnabled =
    options.patch.isZaloMiniAppEnabled === undefined
      ? currentRow?.is_zalo_mini_app_enabled ?? DEFAULT_SYSTEM_SETTINGS.isZaloMiniAppEnabled
      : Boolean(options.patch.isZaloMiniAppEnabled);

  const siteLogoUrl =
    options.patch.siteLogoUrl === undefined
      ? sanitizeText(currentRow?.site_logo_url ?? null)
      : sanitizeText(options.patch.siteLogoUrl ?? null);
  const siteLogoDarkUrl =
    options.patch.siteLogoDarkUrl === undefined
      ? sanitizeText(currentRow?.site_logo_dark_url ?? null)
      : sanitizeText(options.patch.siteLogoDarkUrl ?? null);

  if (currentRow) {
    const updatePayload: Record<string, unknown> = {
      default_locale: defaultLocale,
      default_currency_code: defaultCurrencyCode,
      late_fee_mode: lateFeeMode,
      late_fee_value: lateFeeValue,
      laundry_tracking_enabled: laundryTrackingEnabled,
      updated_by: options.actorProfileId,
    };

    if (hasOptionalColumns) {
      updatePayload.is_shipping_module_enabled = isShippingModuleEnabled;
      updatePayload.is_makeup_module_enabled = isMakeupModuleEnabled;
      updatePayload.is_zalo_mini_app_enabled = isZaloMiniAppEnabled;
      updatePayload.site_logo_url = siteLogoUrl;
      updatePayload.site_logo_dark_url = siteLogoDarkUrl;
    }

    const { error } = await supabase
      .from("system_settings")
      .update(updatePayload)
      .eq("id", currentRow.id);

    if (error) throw error;
    return;
  }

  const insertPayload: Record<string, unknown> = {
    default_locale: defaultLocale,
    default_currency_code: defaultCurrencyCode,
    late_fee_mode: lateFeeMode,
    late_fee_value: lateFeeValue,
    laundry_tracking_enabled: laundryTrackingEnabled,
    updated_by: options.actorProfileId,
  };

  if (hasOptionalColumns) {
    insertPayload.is_shipping_module_enabled = isShippingModuleEnabled;
    insertPayload.is_makeup_module_enabled = isMakeupModuleEnabled;
    insertPayload.is_zalo_mini_app_enabled = isZaloMiniAppEnabled;
    insertPayload.site_logo_url = siteLogoUrl;
    insertPayload.site_logo_dark_url = siteLogoDarkUrl;
  }

  const { error } = await supabase.from("system_settings").insert(insertPayload);

  if (error) throw error;
}

async function upsertBranchPolicy(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    patch: SettingsGeneralUpdatePayload["branchPolicy"];
  }
): Promise<void> {
  if (!options.patch) return;

  const locale =
    options.patch.locale === undefined ? undefined : normalizeLocale(options.patch.locale);
  if (options.patch.locale !== undefined && !locale) {
    throw new SettingsDomainError("INVALID_LOCALE", {
      locale: options.patch.locale,
    });
  }

  const currencyCode =
    options.patch.currencyCode === undefined
      ? undefined
      : normalizeCurrencyCode(options.patch.currencyCode);
  if (options.patch.currencyCode !== undefined && !currencyCode) {
    throw new SettingsDomainError("INVALID_CURRENCY_CODE", {
      currencyCode: options.patch.currencyCode,
    });
  }

  const lateFeeMode =
    options.patch.lateFeeMode === undefined
      ? undefined
      : normalizeLateFeeMode(options.patch.lateFeeMode);
  if (options.patch.lateFeeMode !== undefined && !lateFeeMode) {
    throw new SettingsDomainError("INVALID_LATE_FEE_MODE", {
      lateFeeMode: options.patch.lateFeeMode,
    });
  }

  const lateFeeValue =
    options.patch.lateFeeValue === undefined
      ? undefined
      : parseNonNegativeNumber(options.patch.lateFeeValue);
  if (options.patch.lateFeeValue !== undefined && lateFeeValue === null) {
    throw new SettingsDomainError("INVALID_NON_NEGATIVE_NUMBER", {
      field: "branchLateFeeValue",
      value: options.patch.lateFeeValue,
    });
  }

  const overdueReminderThresholdHours =
    options.patch.overdueReminderThresholdHours === undefined
      ? undefined
      : parseNonNegativeNumber(options.patch.overdueReminderThresholdHours);
  if (
    options.patch.overdueReminderThresholdHours !== undefined &&
    overdueReminderThresholdHours === null
  ) {
    throw new SettingsDomainError("INVALID_NON_NEGATIVE_NUMBER", {
      field: "overdueReminderThresholdHours",
      value: options.patch.overdueReminderThresholdHours,
    });
  }

  const laundryStuckThresholdDays =
    options.patch.laundryStuckThresholdDays === undefined
      ? undefined
      : parseNonNegativeNumber(options.patch.laundryStuckThresholdDays);
  if (
    options.patch.laundryStuckThresholdDays !== undefined &&
    laundryStuckThresholdDays === null
  ) {
    throw new SettingsDomainError("INVALID_NON_NEGATIVE_NUMBER", {
      field: "laundryStuckThresholdDays",
      value: options.patch.laundryStuckThresholdDays,
    });
  }

  const payload: Record<string, unknown> = {
    branch_id: options.branchId,
    updated_by: options.actorProfileId,
  };

  if (locale !== undefined) payload.locale = locale;
  if (currencyCode !== undefined) payload.currency_code = currencyCode;
  if (lateFeeMode !== undefined) payload.late_fee_mode = lateFeeMode;
  if (lateFeeValue !== undefined) payload.late_fee_value = lateFeeValue;
  if (options.patch.laundryTrackingEnabled !== undefined) {
    payload.laundry_tracking_enabled = Boolean(options.patch.laundryTrackingEnabled);
  }
  if (options.patch.isRentalModuleEnabled !== undefined) {
    payload.is_rental_module_enabled = Boolean(options.patch.isRentalModuleEnabled);
  }
  if (options.patch.isMakeupModuleEnabled !== undefined) {
    payload.is_makeup_module_enabled = Boolean(options.patch.isMakeupModuleEnabled);
  }
  if (overdueReminderThresholdHours !== undefined && overdueReminderThresholdHours !== null) {
    payload.overdue_reminder_threshold_hours = Math.floor(overdueReminderThresholdHours);
  }
  if (laundryStuckThresholdDays !== undefined && laundryStuckThresholdDays !== null) {
    payload.laundry_stuck_threshold_days = Math.floor(laundryStuckThresholdDays);
  }

  const { error } = await supabase
    .from("branch_settings")
    .upsert(payload, { onConflict: "branch_id" });

  if (error) throw error;
}

async function upsertOpeningHours(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    rows: SettingsOpeningHourDto[];
  }
): Promise<void> {
  const rows = normalizeOpeningHoursInput(options.rows);

  for (const row of rows) {
    const { error } = await supabase.from("branch_opening_hours").upsert(
      {
        branch_id: options.branchId,
        day_of_week: row.dayOfWeek,
        is_open: row.isOpen,
        open_time: row.isOpen ? row.openTime : null,
        close_time: row.isOpen ? row.closeTime : null,
        break_start_time: row.isOpen ? row.breakStartTime : null,
        break_end_time: row.isOpen ? row.breakEndTime : null,
      },
      {
        onConflict: "branch_id,day_of_week",
      }
    );

    if (error) throw error;
  }
}

async function upsertProductCategories(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    rows: SettingsProductCategoryInput[];
  }
): Promise<void> {
  for (const input of options.rows) {
    const code = sanitizeText(input.code)?.toUpperCase() ?? null;
    const name = sanitizeText(input.name);

    if (!code || !name) {
      throw new SettingsDomainError("INVALID_PRODUCT_CATEGORY", {
        code: input.code,
        name: input.name,
      });
    }

    const isActive = Boolean(input.isActive);

    if (input.id) {
      const { error } = await supabase
        .from("product_categories")
        .update({
          code,
          name,
          is_active: isActive,
        })
        .eq("id", input.id)
        .eq("branch_id", options.branchId);

      if (error) throw error;
      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("product_categories")
      .select("id")
      .eq("branch_id", options.branchId)
      .ilike("code", code)
      .maybeSingle<{ id: string }>();

    if (existingError) throw existingError;

    if (existing) {
      const { error } = await supabase
        .from("product_categories")
        .update({
          name,
          is_active: isActive,
        })
        .eq("id", existing.id)
        .eq("branch_id", options.branchId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("product_categories").insert({
        branch_id: options.branchId,
        code,
        name,
        is_active: isActive,
      });

      if (error) throw error;
    }
  }
}

async function upsertCustomerTags(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    rows: SettingsCustomerTagInput[];
  }
): Promise<void> {
  for (const input of options.rows) {
    const code = sanitizeText(input.code)?.toUpperCase() ?? null;
    const name = sanitizeText(input.name);

    if (!code || !name) {
      throw new SettingsDomainError("INVALID_CUSTOMER_TAG", {
        code: input.code,
        name: input.name,
      });
    }

    const payload = {
      code,
      name,
      color: sanitizeText(input.color),
      warn_on_order_create: Boolean(input.warnOnOrderCreate),
      block_order_create: Boolean(input.blockOrderCreate),
      is_active: Boolean(input.isActive),
    };

    if (input.id) {
      const { error } = await supabase
        .from("customer_tags")
        .update(payload)
        .eq("id", input.id)
        .eq("branch_id", options.branchId);

      if (error) throw error;
      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("customer_tags")
      .select("id")
      .eq("branch_id", options.branchId)
      .ilike("code", code)
      .maybeSingle<{ id: string }>();

    if (existingError) throw existingError;

    if (existing) {
      const { error } = await supabase
        .from("customer_tags")
        .update(payload)
        .eq("id", existing.id)
        .eq("branch_id", options.branchId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("customer_tags").insert({
        branch_id: options.branchId,
        ...payload,
      });

      if (error) throw error;
    }
  }
}

function mapTemplateRow(row: ShowroomPageTemplateRow): SettingsShowroomTemplateDto {
  return {
    id: row.id,
    code: row.code,
    pageKey: row.page_key,
    name: row.name,
    description: row.description,
    previewImagePath: row.preview_image_path,
    templateVersion: row.template_version,
    isActive: row.is_active,
    isDefault: row.is_default,
  };
}

function mapShowroomConfigRow(row: ShowroomPageConfigRow): SettingsShowroomPageConfigDto {
  return {
    id: row.id,
    branchId: row.branch_id,
    locale: normalizeLocale(row.locale) ?? "vi",
    pageKey: "PRODUCT_HOME",
    templateId: row.template_id,
    title: row.title,
    subtitle: row.subtitle,
    heroImagePath: row.hero_image_path,
    heroConfigJson: row.hero_config_json,
    sectionsConfigJson: row.sections_config_json,
    filtersConfigJson: row.filters_config_json,
    seoConfigJson: row.seo_config_json,
    displayConfigJson: row.display_config_json,
    isActive: row.is_active,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

async function fetchShowroomTemplates(
  supabase: SupabaseClient
): Promise<SettingsShowroomTemplateDto[]> {
  const { data, error } = await supabase
    .from("showroom_page_templates")
    .select(
      "id, code, page_key, name, description, preview_image_path, template_version, is_active, is_default"
    )
    .eq("page_key", "PRODUCT_HOME")
    .order("is_default", { ascending: false })
    .order("template_version", { ascending: false })
    .returns<ShowroomPageTemplateRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapTemplateRow);
}

async function fetchShowroomConfig(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    locale: SettingLocale;
  }
): Promise<SettingsShowroomPageConfigDto | null> {
  const { data, error } = await supabase
    .from("showroom_page_configs")
    .select(
      "id, branch_id, locale, page_key, template_id, title, subtitle, hero_image_path, hero_config_json, sections_config_json, filters_config_json, seo_config_json, display_config_json, is_active, is_published, updated_at"
    )
    .eq("branch_id", options.branchId)
    .eq("locale", options.locale)
    .eq("page_key", "PRODUCT_HOME")
    .maybeSingle<ShowroomPageConfigRow>();

  if (error) throw error;
  return data ? mapShowroomConfigRow(data) : null;
}

async function fetchShowroomFeaturedProductOptions(
  supabase: SupabaseClient,
  branchId: string
): Promise<SettingsShowroomFeaturedProductOptionDto[]> {
  const [categories, productRowsResult] = await Promise.all([
    fetchProductCategories(supabase, branchId),
    (async () => {
      const runQuery = (selectFields: string) =>
        supabase
          .from("products")
          .select(selectFields)
          .or(`branch_id.is.null,branch_id.eq.${branchId}`)
          .eq("is_active", true)
          .eq("is_archived", false)
          .order("updated_at", { ascending: false })
          .limit(160)
          .returns<FeaturedProductOptionRow[]>();

      const selectCandidates = [
        "id, product_code, name, cover_image_path, gallery_image_paths, category_id, rent_price_per_day, quick_rent_price",
        "id, product_code, name, cover_image_path, category_id, rent_price_per_day, quick_rent_price",
        "id, product_code, name, cover_image_path, gallery_image_paths, category_id, rent_price_per_day",
        "id, product_code, name, cover_image_path, category_id, rent_price_per_day",
      ];

      let lastResult:
        | Awaited<ReturnType<typeof runQuery>>
        | null = null;

      for (const selectFields of selectCandidates) {
        const result = await runQuery(selectFields);
        if (!result.error) return result;

        lastResult = result;
        const missingGallery = isMissingColumnError(result.error, "gallery_image_paths");
        const missingQuickRent = isMissingColumnError(result.error, "quick_rent_price");
        if (!missingGallery && !missingQuickRent) {
          return result;
        }
      }

      return (
        lastResult ??
        runQuery("id, product_code, name, cover_image_path, category_id, rent_price_per_day")
      );
    })(),
  ]);

  if (productRowsResult.error) throw productRowsResult.error;

  const categoryNameById = new Map(categories.map((entry) => [entry.id, entry.name]));

  return (productRowsResult.data ?? []).map((row) => ({
    id: row.id,
    productCode: row.product_code,
    name: row.name,
    coverImagePath: resolvePrimaryProductImagePath(
      row.cover_image_path,
      row.gallery_image_paths
    ),
    categoryName: row.category_id ? categoryNameById.get(row.category_id) ?? null : null,
    rentPricePerDay: parseNumeric(row.rent_price_per_day),
    quickRentPrice: parseNumeric(row.quick_rent_price),
  }));
}

async function buildShowroomPagesResponse(
  supabase: SupabaseClient,
  options: {
    scope: "branch" | "global";
    branchId: string;
    locale: SettingLocale;
  }
): Promise<SettingsShowroomPagesResponse> {
  const [templates, config, featuredProductOptions] = await Promise.all([
    fetchShowroomTemplates(supabase),
    fetchShowroomConfig(supabase, {
      branchId: options.branchId,
      locale: options.locale,
    }),
    fetchShowroomFeaturedProductOptions(supabase, options.branchId),
  ]);

  return {
    scope: options.scope,
    branchId: options.branchId,
    locale: options.locale,
    templates,
    featuredProductOptions,
    config,
  };
}

async function ensureTemplateSelectable(
  supabase: SupabaseClient,
  templateId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("showroom_page_templates")
    .select("id, is_active, page_key")
    .eq("id", templateId)
    .maybeSingle<{ id: string; is_active: boolean; page_key: string }>();

  if (error) throw error;
  if (!data || data.page_key !== "PRODUCT_HOME") {
    throw new SettingsDomainError("TEMPLATE_NOT_FOUND", {
      templateId,
    });
  }

  if (!data.is_active) {
    throw new SettingsDomainError("TEMPLATE_INACTIVE", {
      templateId,
    });
  }
}

async function fetchProfileById(
  supabase: SupabaseClient,
  profileId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, default_branch_id, locale, is_active, disabled_at, created_at, updated_at"
    )
    .eq("id", profileId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ?? null;
}

async function fetchUsersBranchAccess(
  supabase: SupabaseClient,
  profileIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (profileIds.length === 0) return map;

  const { data, error } = await supabase
    .from("profile_branch_access")
    .select("profile_id, branch_id")
    .in("profile_id", profileIds)
    .eq("is_delete", false)
    .returns<ProfileBranchAccessRow[]>();

  if (error) throw error;

  for (const row of data ?? []) {
    const profileId = row.profile_id;
    if (!profileId) continue;

    const bucket = map.get(profileId);
    if (bucket) {
      bucket.push(row.branch_id);
    } else {
      map.set(profileId, [row.branch_id]);
    }
  }

  return map;
}

function mapProfileRowToSettingsUser(options: {
  profile: ProfileRow;
  branchIds: string[];
}): SettingsUserRowDto {
  return {
    profileId: options.profile.id,
    fullName: options.profile.full_name,
    email: options.profile.email,
    phone: options.profile.phone,
    role: normalizeShowroomRole(options.profile.role) ?? "customer",
    defaultBranchId: options.profile.default_branch_id,
    locale: normalizeLocale(options.profile.locale) ?? "vi",
    isActive: options.profile.is_active,
    disabledAt: options.profile.disabled_at,
    branchIds: options.branchIds,
    createdAt: options.profile.created_at,
    updatedAt: options.profile.updated_at,
  };
}

async function ensureBranchesExist(
  supabase: SupabaseClient,
  branchIds: string[]
): Promise<void> {
  if (branchIds.length === 0) return;

  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .in("id", branchIds)
    .returns<Array<{ id: string }>>();

  if (error) throw error;

  const found = new Set((data ?? []).map((row) => row.id));
  const missing = branchIds.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new SettingsDomainError("BRANCH_NOT_FOUND", {
      branchIds: missing,
    });
  }
}

function normalizeBranchIds(value: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const normalized = sanitizeText(entry);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function validateRoleBranchAssignment(options: {
  role: ShowroomRole;
  defaultBranchId: string | null;
  branchIds: string[];
}): void {
  if (options.role === "owner_admin" || options.role === "customer") {
    return;
  }

  if (options.branchIds.length === 0) {
    throw new SettingsDomainError("INVALID_BRANCH_ASSIGNMENT", {
      reason: "branch-required",
      role: options.role,
    });
  }

  if (!options.defaultBranchId) {
    throw new SettingsDomainError("INVALID_BRANCH_ASSIGNMENT", {
      reason: "default-branch-required",
      role: options.role,
    });
  }

  if (!options.branchIds.includes(options.defaultBranchId)) {
    throw new SettingsDomainError("INVALID_BRANCH_ASSIGNMENT", {
      reason: "default-branch-not-allowed",
      role: options.role,
      defaultBranchId: options.defaultBranchId,
    });
  }
}

function assertOwnerAdminRoleIsSeedOnly(options: {
  role: ShowroomRole;
  action: "create" | "update";
  userId?: string;
}): void {
  if (options.role !== OWNER_ADMIN_ROLE) return;

  throw new SettingsDomainError("OWNER_ADMIN_ROLE_IS_SEED_ONLY", {
    action: options.action,
    role: options.role,
    userId: options.userId ?? null,
  });
}

function assertOwnerAdminRoleImmutable(options: {
  currentRole: ShowroomRole;
  nextRole: ShowroomRole;
  userId: string;
}): void {
  if (options.currentRole !== OWNER_ADMIN_ROLE) return;
  if (options.nextRole === OWNER_ADMIN_ROLE) return;

  throw new SettingsDomainError("OWNER_ADMIN_ROLE_IMMUTABLE", {
    userId: options.userId,
    role: options.currentRole,
    nextRole: options.nextRole,
  });
}

async function replaceUserBranchAccess(
  supabase: SupabaseClient,
  options: {
    profileId: string;
    branchIds: string[];
    defaultBranchId: string | null;
  }
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("profile_branch_access")
    .update({
      is_delete: true,
      is_default: false,
    })
    .eq("profile_id", options.profileId)
    .eq("is_delete", false);

  if (deleteError) throw deleteError;

  if (options.branchIds.length === 0) {
    return;
  }

  const insertRows = options.branchIds.map((branchId) => ({
    profile_id: options.profileId,
    branch_id: branchId,
    is_default: options.defaultBranchId === branchId,
    is_delete: false,
  }));

  const { error: insertError } = await supabase
    .from("profile_branch_access")
    .insert(insertRows);

  if (insertError) throw insertError;
}

export async function getSettingsGeneralForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: SettingsGeneralQuery;
  }
): Promise<SettingsGeneralResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureSettingsBranchScopedRole(context);

  const branchId = resolveBranchId({
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
    context,
  });

  return buildGeneralSettingsResponse(supabase, {
    context,
    branchId,
  });
}

export async function updateSettingsGeneralForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: SettingsGeneralUpdatePayload;
  }
): Promise<SettingsGeneralResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureSettingsBranchScopedRole(context);

  const branchId = resolveBranchId({
    requestedBranchId: sanitizeText(options.payload.branchId),
    context,
  });

  await ensureBranchExists(supabase, branchId);

  const hasSystemDefaultsPatch =
    !!options.payload.systemDefaults &&
    Object.keys(options.payload.systemDefaults).length > 0;
  const hasBranchRentalModuleTogglePatch =
    !!options.payload.branchPolicy &&
    Object.prototype.hasOwnProperty.call(
      options.payload.branchPolicy,
      "isRentalModuleEnabled"
    );

  if (hasSystemDefaultsPatch && !isOwnerAdminRole(context.actor.role)) {
    console.warn(
      `[settings-audit] ${JSON.stringify({
        level: "warn",
        action: "settings.general.update",
        resource: "system_settings",
        actorId: context.actor.id,
        actorRole: context.actor.role,
        branchId,
        reason: "manager-global-settings-denied",
        timestamp: new Date().toISOString(),
      })}`
    );
    throw new SettingsDomainError("FORBIDDEN_SETTINGS_ACCESS", {
      role: context.actor.role,
      reason: "system-settings-readonly-for-manager",
    });
  }

  if (hasBranchRentalModuleTogglePatch && !isOwnerAdminRole(context.actor.role)) {
    throw new SettingsDomainError("FORBIDDEN_SETTINGS_ACCESS", {
      role: context.actor.role,
      reason: "branch-module-settings-readonly-for-manager",
    });
  }

  if (hasSystemDefaultsPatch) {
    await upsertSystemSettings(supabase, {
      actorProfileId: options.actorProfileId,
      patch: options.payload.systemDefaults,
    });
  }

  await upsertBranchPolicy(supabase, {
    actorProfileId: options.actorProfileId,
    branchId,
    patch: options.payload.branchPolicy,
  });

  if (options.payload.openingHours) {
    await upsertOpeningHours(supabase, {
      branchId,
      rows: options.payload.openingHours,
    });
  }

  if (options.payload.productCategories) {
    await upsertProductCategories(supabase, {
      branchId,
      rows: options.payload.productCategories,
    });
  }

  if (options.payload.customerTags) {
    await upsertCustomerTags(supabase, {
      branchId,
      rows: options.payload.customerTags,
    });
  }

  return buildGeneralSettingsResponse(supabase, {
    context,
    branchId,
  });
}

export async function getShowroomPagesSettingsForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: SettingsShowroomPagesQuery;
  }
): Promise<SettingsShowroomPagesResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureSettingsBranchScopedRole(context);

  const locale = normalizeLocale(options.query.locale ?? null) ?? "vi";
  const branchId = resolveBranchId({
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
    context,
  });

  return buildShowroomPagesResponse(supabase, {
    scope: "branch",
    branchId,
    locale,
  });
}

export async function updateShowroomPagesSettingsForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: SettingsShowroomPagesUpdatePayload;
  }
): Promise<SettingsShowroomPagesResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureSettingsBranchScopedRole(context);

  const locale = normalizeLocale(options.payload.locale);
  if (!locale) {
    throw new SettingsDomainError("INVALID_LOCALE", {
      locale: options.payload.locale,
    });
  }

  const branchId = resolveBranchId({
    requestedBranchId: sanitizeText(options.payload.branchId),
    context,
  });

  const templateId = sanitizeText(options.payload.templateId);
  if (!templateId) {
    throw new SettingsDomainError("TEMPLATE_NOT_FOUND", {
      templateId: options.payload.templateId,
    });
  }

  await ensureTemplateSelectable(supabase, templateId);

  const payload: Record<string, unknown> = {
    branch_id: branchId,
    locale,
    page_key: "PRODUCT_HOME",
    template_id: templateId,
    updated_by: options.actorProfileId,
  };

  if (Object.prototype.hasOwnProperty.call(options.payload, "title")) {
    payload.title = sanitizeText(options.payload.title ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "subtitle")) {
    payload.subtitle = sanitizeText(options.payload.subtitle ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "heroImagePath")) {
    payload.hero_image_path = sanitizeText(options.payload.heroImagePath ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "heroConfigJson")) {
    payload.hero_config_json = options.payload.heroConfigJson ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "sectionsConfigJson")) {
    payload.sections_config_json = options.payload.sectionsConfigJson ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "filtersConfigJson")) {
    payload.filters_config_json = options.payload.filtersConfigJson ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "seoConfigJson")) {
    payload.seo_config_json = options.payload.seoConfigJson ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "displayConfigJson")) {
    payload.display_config_json = options.payload.displayConfigJson ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "isActive")) {
    payload.is_active = Boolean(options.payload.isActive);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "isPublished")) {
    payload.is_published = Boolean(options.payload.isPublished);
  }

  const { error } = await supabase
    .from("showroom_page_configs")
    .upsert(payload, {
      onConflict: "branch_id,locale,page_key",
    });

  if (error) throw error;

  return buildShowroomPagesResponse(supabase, {
    scope: "branch",
    branchId,
    locale,
  });
}

export async function listSettingsUsersForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: SettingsUsersQuery;
    serviceRoleClient?: SupabaseClient;
  }
): Promise<SettingsUsersResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  if (options.serviceRoleClient) {
    try {
      await syncMissingProfilesFromAuthUsers(supabase, options.serviceRoleClient);
    } catch {
      // Keep users listing resilient when auth-admin sync is temporarily unavailable.
    }
  }

  const branchFilter = sanitizeText(options.query.branchId ?? null);

  const [branches, profiles] = await Promise.all([
    fetchAccessibleBranches(supabase, { context }),
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, role, default_branch_id, locale, is_active, disabled_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .returns<ProfileRow[]>(),
  ]);

  if (profiles.error) throw profiles.error;
  const profileRows = profiles.data ?? [];

  const profileIds = profileRows.map((row) => row.id);
  const branchAccessByProfile = await fetchUsersBranchAccess(supabase, profileIds);

  let items = profileRows.map((row) =>
    mapProfileRowToSettingsUser({
      profile: row,
      branchIds: branchAccessByProfile.get(row.id) ?? [],
    })
  );

  if (branchFilter) {
    items = items.filter(
      (row) => row.branchIds.includes(branchFilter) || row.defaultBranchId === branchFilter
    );
  }

  return {
    items,
    branches,
  };
}

export async function createSettingsUserForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: SettingsCreateUserPayload;
    serviceRoleClient: SupabaseClient;
  }
): Promise<SettingsUserRowDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const email = sanitizeText(options.payload.email)?.toLowerCase() ?? null;
  if (!email || !email.includes("@")) {
    throw new SettingsDomainError("INVALID_CUSTOMER_TAG", {
      field: "email",
      email: options.payload.email,
    });
  }

  const role = normalizeShowroomRole(options.payload.role);
  if (!role) {
    throw new SettingsDomainError("INVALID_ROLE", {
      role: options.payload.role,
    });
  }
  assertOwnerAdminRoleIsSeedOnly({
    role,
    action: "create",
  });

  const locale = normalizeLocale(options.payload.locale ?? "vi") ?? "vi";
  const branchIds = normalizeBranchIds(options.payload.branchIds ?? []);
  const defaultBranchId = sanitizeText(options.payload.defaultBranchId ?? null);
  const fullName = sanitizeText(options.payload.fullName);
  const phone = sanitizeText(options.payload.phone);
  const createPassword = sanitizeText(options.payload.password ?? null);

  validateRoleBranchAssignment({
    role,
    defaultBranchId,
    branchIds,
  });

  await ensureBranchesExist(supabase, branchIds);

  if (createPassword && createPassword.length < 6) {
    throw new SettingsDomainError("INVALID_CREATE_PASSWORD");
  }

  let userId: string | null = null;
  if (createPassword) {
    const { data: createdUser, error: createUserError } =
      await options.serviceRoleClient.auth.admin.createUser({
        email,
        password: createPassword,
        email_confirm: true,
        app_metadata: {
          role,
        },
        user_metadata: {
          full_name: fullName,
          phone,
          locale,
          role,
        },
      });

    if (createUserError) throw createUserError;
    userId = createdUser.user?.id ?? null;
  } else {
    if (!isEmailSenderEnabled()) {
      throw new SettingsDomainError("EMAIL_SENDER_DISABLED");
    }

    const redirectTo = sanitizeText(options.payload.redirectTo ?? null) ?? undefined;
    const { data: invited, error: inviteError } =
      await options.serviceRoleClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role,
          locale,
          phone,
        },
        redirectTo,
      });

    if (inviteError) throw inviteError;
    userId = invited.user?.id ?? null;
  }

  if (!userId) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      email,
      reason: "create-response-missing-user-id",
    });
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      email,
      phone,
      role,
      default_branch_id: defaultBranchId,
      locale,
      is_active: true,
      disabled_at: null,
      disabled_by: null,
      invited_by: options.actorProfileId,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) throw profileError;

  await replaceUserBranchAccess(supabase, {
    profileId: userId,
    branchIds,
    defaultBranchId,
  });

  const profile = await fetchProfileById(supabase, userId);
  if (!profile) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      userId,
    });
  }

  const accessMap = await fetchUsersBranchAccess(supabase, [userId]);

  return mapProfileRowToSettingsUser({
    profile,
    branchIds: accessMap.get(userId) ?? [],
  });
}

export async function updateSettingsUserForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    userId: string;
    payload: SettingsUpdateUserPayload;
    serviceRoleClient: SupabaseClient;
  }
): Promise<SettingsUserRowDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const target = await fetchProfileById(supabase, options.userId);
  if (!target) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      userId: options.userId,
    });
  }

  if (options.payload.isActive === false && options.userId === options.actorProfileId) {
    throw new SettingsDomainError("CANNOT_DISABLE_SELF", {
      userId: options.userId,
    });
  }

  const targetRole = normalizeShowroomRole(target.role) ?? "customer";

  const role =
    options.payload.role === undefined
      ? targetRole
      : normalizeShowroomRole(options.payload.role);

  if (!role) {
    throw new SettingsDomainError("INVALID_ROLE", {
      role: options.payload.role,
    });
  }

  if (options.payload.role !== undefined) {
    assertOwnerAdminRoleIsSeedOnly({
      role,
      action: "update",
      userId: target.id,
    });
    assertOwnerAdminRoleImmutable({
      currentRole: targetRole,
      nextRole: role,
      userId: target.id,
    });
  }

  const locale =
    options.payload.locale === undefined
      ? normalizeLocale(target.locale) ?? "vi"
      : normalizeLocale(options.payload.locale);

  if (!locale) {
    throw new SettingsDomainError("INVALID_LOCALE", {
      locale: options.payload.locale,
    });
  }

  const currentAccess = await fetchUsersBranchAccess(supabase, [target.id]);
  const currentBranchIds = currentAccess.get(target.id) ?? [];

  const nextBranchIds =
    options.payload.branchIds === undefined
      ? currentBranchIds
      : normalizeBranchIds(options.payload.branchIds);

  const nextDefaultBranchId =
    options.payload.defaultBranchId === undefined
      ? sanitizeText(target.default_branch_id)
      : sanitizeText(options.payload.defaultBranchId);

  const shouldValidateBranchAssignment =
    options.payload.branchIds !== undefined ||
    options.payload.defaultBranchId !== undefined ||
    options.payload.role !== undefined;

  if (shouldValidateBranchAssignment) {
    validateRoleBranchAssignment({
      role,
      defaultBranchId: nextDefaultBranchId,
      branchIds: nextBranchIds,
    });

    await ensureBranchesExist(supabase, nextBranchIds);
  }

  const nextIsActive =
    options.payload.isActive === undefined ? target.is_active : Boolean(options.payload.isActive);

  const updatePayload: Record<string, unknown> = {
    role,
    locale,
    default_branch_id: nextDefaultBranchId,
    is_active: nextIsActive,
    disabled_at: nextIsActive ? null : new Date().toISOString(),
    disabled_by: nextIsActive ? null : options.actorProfileId,
  };

  if (Object.prototype.hasOwnProperty.call(options.payload, "fullName")) {
    updatePayload.full_name = sanitizeText(options.payload.fullName ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "phone")) {
    updatePayload.phone = sanitizeText(options.payload.phone ?? null);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", target.id);

  if (updateError) throw updateError;

  if (shouldValidateBranchAssignment) {
    await replaceUserBranchAccess(supabase, {
      profileId: target.id,
      branchIds: nextBranchIds,
      defaultBranchId: nextDefaultBranchId,
    });
  }

  const metadataPatch: Record<string, unknown> = {
    role,
    locale,
  };

  if (Object.prototype.hasOwnProperty.call(options.payload, "fullName")) {
    metadataPatch.full_name = sanitizeText(options.payload.fullName ?? null);
  }

  const authUserId = await resolveAuthUserIdFromProfile({
    serviceRoleClient: options.serviceRoleClient,
    profileId: target.id,
    profileEmail: target.email,
  });
  if (authUserId) {
    const { error: authUpdateError } = await options.serviceRoleClient.auth.admin.updateUserById(
      authUserId,
      {
        app_metadata: {
          role,
        },
        user_metadata: metadataPatch,
      }
    );
    if (authUpdateError) throw authUpdateError;
  }

  const profile = await fetchProfileById(supabase, target.id);
  if (!profile) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      userId: target.id,
    });
  }

  const accessMap = await fetchUsersBranchAccess(supabase, [target.id]);

  return mapProfileRowToSettingsUser({
    profile,
    branchIds: accessMap.get(target.id) ?? [],
  });
}

export async function triggerUserPasswordResetForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    userId: string;
    payload: SettingsResetUserPasswordPayload;
    serviceRoleClient: SupabaseClient;
  }
): Promise<{ success: true }> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const target = await fetchProfileById(supabase, options.userId);
  if (!target) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      userId: options.userId,
    });
  }

  const nextPassword = sanitizeText(options.payload.newPassword);
  if (!nextPassword || nextPassword.length < 6) {
    throw new SettingsDomainError("INVALID_RESET_PASSWORD", {
      userId: options.userId,
    });
  }

  const authUserId = await resolveAuthUserIdFromProfile({
    serviceRoleClient: options.serviceRoleClient,
    profileId: target.id,
    profileEmail: target.email,
  });
  if (!authUserId) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      userId: options.userId,
      reason: "auth-user-missing",
    });
  }

  const { data, error } = await options.serviceRoleClient.auth.admin.updateUserById(authUserId, {
    password: nextPassword,
    email_confirm: true,
  });

  if (error) throw error;
  if (!data.user?.id) {
    throw new SettingsDomainError("USER_NOT_FOUND", {
      userId: options.userId,
      authUserId,
      reason: "auth-update-missing-user",
    });
  }

  return {
    success: true,
  };
}

export async function listBranchesForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
  }
): Promise<SettingsBranchesResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const items = await fetchAccessibleBranches(supabase, { context });

  return {
    items,
  };
}

export async function createBranchForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: SettingsCreateBranchPayload;
  }
): Promise<SettingsBranchDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const code = sanitizeText(options.payload.code)?.toUpperCase() ?? null;
  const name = sanitizeText(options.payload.name);

  if (!code || !name) {
    throw new SettingsDomainError("INVALID_BRANCH_ASSIGNMENT", {
      reason: "code-name-required",
    });
  }

  const timezone = sanitizeText(options.payload.timezone) ?? DEFAULT_TIMEZONE;
  const currencyCode = normalizeCurrencyCode(options.payload.currencyCode ?? DEFAULT_CURRENCY_CODE);

  if (!currencyCode) {
    throw new SettingsDomainError("INVALID_CURRENCY_CODE", {
      currencyCode: options.payload.currencyCode,
    });
  }

  const { data, error } = await supabase
    .from("branches")
    .insert({
      code,
      name,
      address: sanitizeText(options.payload.address ?? null),
      phone: sanitizeText(options.payload.phone ?? null),
      timezone,
      currency_code: currencyCode,
      is_active: true,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select("id, code, name, address, phone, timezone, currency_code, is_active")
    .maybeSingle<BranchRow>();

  if (error) throw error;
  if (!data) {
    throw new SettingsDomainError("BRANCH_NOT_FOUND", {
      reason: "insert-returned-empty",
    });
  }

  return mapBranchRow(data);
}

export async function updateBranchForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId: string;
    payload: SettingsUpdateBranchPayload;
  }
): Promise<SettingsBranchDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  await ensureBranchExists(supabase, options.branchId);

  const patch: Record<string, unknown> = {
    updated_by: options.actorProfileId,
  };

  if (Object.prototype.hasOwnProperty.call(options.payload, "name")) {
    const name = sanitizeText(options.payload.name ?? null);
    if (!name) {
      throw new SettingsDomainError("INVALID_BRANCH_ASSIGNMENT", {
        reason: "name-required",
      });
    }
    patch.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "address")) {
    patch.address = sanitizeText(options.payload.address ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "phone")) {
    patch.phone = sanitizeText(options.payload.phone ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "timezone")) {
    patch.timezone = sanitizeText(options.payload.timezone ?? null) ?? DEFAULT_TIMEZONE;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "currencyCode")) {
    const currencyCode = normalizeCurrencyCode(options.payload.currencyCode ?? null);
    if (!currencyCode) {
      throw new SettingsDomainError("INVALID_CURRENCY_CODE", {
        currencyCode: options.payload.currencyCode,
      });
    }
    patch.currency_code = currencyCode;
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, "isActive")) {
    patch.is_active = Boolean(options.payload.isActive);
  }

  const { data, error } = await supabase
    .from("branches")
    .update(patch)
    .eq("id", options.branchId)
    .select("id, code, name, address, phone, timezone, currency_code, is_active")
    .maybeSingle<BranchRow>();

  if (error) throw error;
  if (!data) {
    throw new SettingsDomainError("BRANCH_NOT_FOUND", {
      branchId: options.branchId,
    });
  }

  return mapBranchRow(data);
}

export async function listProductCategoriesForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: SettingsProductCategoriesQuery;
  }
): Promise<SettingsProductCategoriesResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureProductCatalogRole(context);

  const branchId = resolveBranchId({
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
    context,
  });
  await ensureBranchExists(supabase, branchId);

  const [branches, categoryRowsResult] = await Promise.all([
    fetchAccessibleBranches(supabase, { context }),
    supabase
      .from("product_categories")
      .select("id, branch_id, code, name, sort_order, is_active")
      .eq("branch_id", branchId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<ProductCategoryRow[]>(),
  ]);

  if (categoryRowsResult.error) throw categoryRowsResult.error;
  const categoryRows = categoryRowsResult.data ?? [];
  const productCountByProductCategoryId = await fetchProductCountByProductCategoryIds(
    supabase,
    categoryRows.map((row) => row.id)
  );

  return {
    branchId,
    branches,
    items: categoryRows.map((row) =>
      mapManagedProductCategoryRow({
        row,
        productCount: productCountByProductCategoryId.get(row.id) ?? 0,
      })
    ),
  };
}

export async function createProductCategoryForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: SettingsCreateProductCategoryPayload;
  }
): Promise<SettingsManagedProductCategoryDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureProductCatalogRole(context);

  const branchId = resolveBranchId({
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
    context,
  });
  await ensureBranchExists(supabase, branchId);

  const code = sanitizeText(options.payload.code)?.toUpperCase() ?? null;
  const name = sanitizeText(options.payload.name);

  if (!code || !name) {
    throw new SettingsDomainError("INVALID_PRODUCT_CATEGORY", {
      reason: "code-name-required",
      code: options.payload.code,
      name: options.payload.name,
    });
  }

  const sortOrder = parseNonNegativeNumber(options.payload.sortOrder ?? 0);
  if (sortOrder === null) {
    throw new SettingsDomainError("INVALID_NON_NEGATIVE_NUMBER", {
      field: "sortOrder",
      value: options.payload.sortOrder,
    });
  }

  await ensureProductCategoryCodeUnique(supabase, {
    branchId,
    code,
  });

  const { data, error } = await supabase
    .from("product_categories")
    .insert({
      branch_id: branchId,
      code,
      name,
      sort_order: Math.floor(sortOrder),
      is_active: options.payload.isActive === undefined ? true : Boolean(options.payload.isActive),
    })
    .select("id, branch_id, code, name, sort_order, is_active")
    .maybeSingle<ProductCategoryRow>();

  if (error) throw error;
  if (!data) {
    throw new SettingsDomainError("PRODUCT_CATEGORY_NOT_FOUND", {
      reason: "insert-returned-empty",
    });
  }

  return mapManagedProductCategoryRow({
    row: data,
    productCount: 0,
  });
}

export async function updateProductCategoryForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    productCategoryId: string;
    payload: SettingsUpdateProductCategoryPayload;
  }
): Promise<SettingsManagedProductCategoryDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureProductCatalogRole(context);

  const currentCategory = await getProductCategoryById(supabase, options.productCategoryId);
  if (!currentCategory) {
    throw new SettingsDomainError("PRODUCT_CATEGORY_NOT_FOUND", {
      productCategoryId: options.productCategoryId,
    });
  }

  if (!currentCategory.branch_id) {
    throw new SettingsDomainError("FORBIDDEN_BRANCH_SCOPE", {
      reason: "system-category-readonly",
      productCategoryId: currentCategory.id,
    });
  }

  if (!context.allowedBranchIds.includes(currentCategory.branch_id)) {
    throw new SettingsDomainError("FORBIDDEN_BRANCH_SCOPE", {
      productCategoryId: currentCategory.id,
      branchId: currentCategory.branch_id,
    });
  }

  const patch: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(options.payload, "code")) {
    const code = sanitizeText(options.payload.code ?? null)?.toUpperCase() ?? null;
    if (!code) {
      throw new SettingsDomainError("INVALID_PRODUCT_CATEGORY", {
        reason: "code-required",
        code: options.payload.code,
      });
    }

    await ensureProductCategoryCodeUnique(supabase, {
      branchId: currentCategory.branch_id,
      code,
      excludeProductCategoryId: currentCategory.id,
    });
    patch.code = code;
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "name")) {
    const name = sanitizeText(options.payload.name ?? null);
    if (!name) {
      throw new SettingsDomainError("INVALID_PRODUCT_CATEGORY", {
        reason: "name-required",
        name: options.payload.name,
      });
    }
    patch.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "sortOrder")) {
    const sortOrder = parseNonNegativeNumber(options.payload.sortOrder);
    if (sortOrder === null) {
      throw new SettingsDomainError("INVALID_NON_NEGATIVE_NUMBER", {
        field: "sortOrder",
        value: options.payload.sortOrder,
      });
    }
    patch.sort_order = Math.floor(sortOrder);
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "isActive")) {
    patch.is_active = Boolean(options.payload.isActive);
  }

  let nextCategory = currentCategory;

  if (Object.keys(patch).length > 0) {
    const { data, error } = await supabase
      .from("product_categories")
      .update(patch)
      .eq("id", currentCategory.id)
      .eq("branch_id", currentCategory.branch_id)
      .select("id, branch_id, code, name, sort_order, is_active")
      .maybeSingle<ProductCategoryRow>();

    if (error) throw error;
    if (!data) {
      throw new SettingsDomainError("PRODUCT_CATEGORY_NOT_FOUND", {
        productCategoryId: currentCategory.id,
      });
    }
    nextCategory = data;
  }

  const productCountByProductCategoryId = await fetchProductCountByProductCategoryIds(supabase, [nextCategory.id]);

  return mapManagedProductCategoryRow({
    row: nextCategory,
    productCount: productCountByProductCategoryId.get(nextCategory.id) ?? 0,
  });
}

export async function deleteProductCategoryForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    productCategoryId: string;
  }
): Promise<{ success: true }> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureProductCatalogRole(context);

  const currentCategory = await getProductCategoryById(supabase, options.productCategoryId);
  if (!currentCategory) {
    throw new SettingsDomainError("PRODUCT_CATEGORY_NOT_FOUND", {
      productCategoryId: options.productCategoryId,
    });
  }

  if (!currentCategory.branch_id) {
    throw new SettingsDomainError("FORBIDDEN_BRANCH_SCOPE", {
      reason: "system-category-readonly",
      productCategoryId: currentCategory.id,
    });
  }

  if (!context.allowedBranchIds.includes(currentCategory.branch_id)) {
    throw new SettingsDomainError("FORBIDDEN_BRANCH_SCOPE", {
      productCategoryId: currentCategory.id,
      branchId: currentCategory.branch_id,
    });
  }

  const productCountByProductCategoryId = await fetchProductCountByProductCategoryIds(supabase, [currentCategory.id]);
  const productCount = productCountByProductCategoryId.get(currentCategory.id) ?? 0;
  if (productCount > 0) {
    throw new SettingsDomainError("PRODUCT_CATEGORY_IN_USE", {
      productCategoryId: currentCategory.id,
      productCount,
    });
  }

  const { error } = await supabase
    .from("product_categories")
    .update({
      is_delete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentCategory.id)
    .eq("branch_id", currentCategory.branch_id)
    .eq("is_delete", false);

  if (error) throw error;

  return {
    success: true,
  };
}

async function ensureShowroomSlugUnique(
  supabase: SupabaseClient,
  options: {
    slug: string;
    excludeShowroomId?: string | null;
  }
): Promise<void> {
  let query = supabase
    .from("showrooms")
    .select("id")
    .eq("slug", options.slug)
    .limit(1);

  if (options.excludeShowroomId) {
    query = query.neq("id", options.excludeShowroomId);
  }

  const { data, error } = await query.returns<Array<{ id: string }>>();
  if (error) throw error;

  if ((data ?? []).length > 0) {
    throw new SettingsDomainError("SHOWROOM_SLUG_DUPLICATE", {
      slug: options.slug,
    });
  }
}

function mapShowroomToPublicContext(row: ShowroomRow): PublicShowroomContext {
  return {
    showroomId: row.id,
    showroomSlug: row.slug,
    showroomName: row.name,
    isDefaultShowroom: row.is_default,
    branchId: row.branch_id,
  };
}

export async function resolvePublicShowroomContext(
  supabase: SupabaseClient,
  options: {
    showroomSlug?: string | null;
    branchId?: string | null;
  }
): Promise<PublicShowroomContext | null> {
  const normalizedShowroomSlug = normalizeShowroomSlug(options.showroomSlug ?? null);
  const normalizedBranchId = sanitizeText(options.branchId ?? null);

  if (options.showroomSlug && !normalizedShowroomSlug) {
    throw new SettingsDomainError("SHOWROOM_NOT_FOUND", {
      showroomSlug: options.showroomSlug,
    });
  }

  if (normalizedShowroomSlug) {
    const { data, error } = await supabase
      .from("showrooms")
      .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
      .eq("slug", normalizedShowroomSlug)
      .eq("is_active", true)
      .maybeSingle<ShowroomRow>();

    if (error) throw error;
    if (!data) {
      throw new SettingsDomainError("SHOWROOM_NOT_FOUND", {
        showroomSlug: normalizedShowroomSlug,
      });
    }

    return mapShowroomToPublicContext(data);
  }

  if (normalizedBranchId) {
    const { data, error } = await supabase
      .from("showrooms")
      .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
      .eq("branch_id", normalizedBranchId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<ShowroomRow>();

    if (error) throw error;
    if (data) {
      return mapShowroomToPublicContext(data);
    }
  }

  const { data: defaultShowroom, error: defaultShowroomError } = await supabase
    .from("showrooms")
    .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
    .eq("is_default", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle<ShowroomRow>();

  if (defaultShowroomError) throw defaultShowroomError;
  if (defaultShowroom) {
    return mapShowroomToPublicContext(defaultShowroom);
  }

  const { data: fallbackShowroom, error: fallbackShowroomError } = await supabase
    .from("showrooms")
    .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ShowroomRow>();

  if (fallbackShowroomError) throw fallbackShowroomError;
  if (!fallbackShowroom) return null;

  return mapShowroomToPublicContext(fallbackShowroom);
}

export async function listShowroomsForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
  }
): Promise<SettingsShowroomsResponse> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const [branches, showroomRowsResult] = await Promise.all([
    fetchAccessibleBranches(supabase, { context }),
    supabase
      .from("showrooms")
      .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })
      .returns<ShowroomRow[]>(),
  ]);

  if (showroomRowsResult.error) throw showroomRowsResult.error;

  const branchById = new Map(branches.map((entry) => [entry.id, entry]));
  const items = (showroomRowsResult.data ?? []).map((row) =>
    mapShowroomRow({
      row,
      branchById,
    })
  );

  return {
    items,
    branches,
  };
}

export async function createShowroomForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: SettingsCreateShowroomPayload;
  }
): Promise<SettingsShowroomDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const name = sanitizeText(options.payload.name);
  if (!name) {
    throw new SettingsDomainError("SHOWROOM_NAME_REQUIRED", {
      reason: "name-required",
    });
  }

  const branchId = sanitizeText(options.payload.branchId);
  if (!branchId) {
    throw new SettingsDomainError("BRANCH_NOT_FOUND", {
      reason: "branch-required",
    });
  }

  const slug = resolveShowroomSlug({
    requestedSlug: options.payload.slug,
    fallbackName: name,
  });
  await ensureShowroomSlugUnique(supabase, { slug });

  await ensureBranchExists(supabase, branchId);

  const { data, error } = await supabase
    .from("showrooms")
    .insert({
      name,
      slug,
      branch_id: branchId,
      is_default: false,
      is_active: options.payload.isActive === undefined ? true : Boolean(options.payload.isActive),
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
    .maybeSingle<ShowroomRow>();

  if (error) throw error;
  if (!data) {
    throw new SettingsDomainError("SHOWROOM_NOT_FOUND", {
      reason: "insert-returned-empty",
    });
  }

  const [branches] = await Promise.all([fetchAccessibleBranches(supabase, { context })]);
  const branchById = new Map(branches.map((entry) => [entry.id, entry]));

  return mapShowroomRow({
    row: data,
    branchById,
  });
}

export async function updateShowroomForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    showroomId: string;
    payload: SettingsUpdateShowroomPayload;
  }
): Promise<SettingsShowroomDto> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const currentShowroom = await getShowroomById(supabase, options.showroomId);
  if (!currentShowroom) {
    throw new SettingsDomainError("SHOWROOM_NOT_FOUND", {
      showroomId: options.showroomId,
    });
  }

  if (currentShowroom.is_default) {
    throw new SettingsDomainError("SHOWROOM_DEFAULT_IMMUTABLE", {
      showroomId: options.showroomId,
    });
  }

  const patch: Record<string, unknown> = {
    updated_by: options.actorProfileId,
  };

  if (Object.prototype.hasOwnProperty.call(options.payload, "name")) {
    const name = sanitizeText(options.payload.name ?? null);
    if (!name) {
      throw new SettingsDomainError("SHOWROOM_NAME_REQUIRED", {
        reason: "name-required",
      });
    }
    patch.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "slug")) {
    const slug = resolveShowroomSlug({
      requestedSlug: options.payload.slug,
      fallbackName: options.payload.name ?? currentShowroom.name,
    });
    await ensureShowroomSlugUnique(supabase, {
      slug,
      excludeShowroomId: currentShowroom.id,
    });
    patch.slug = slug;
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "branchId")) {
    const branchId = sanitizeText(options.payload.branchId ?? null);
    if (!branchId) {
      throw new SettingsDomainError("BRANCH_NOT_FOUND", {
        reason: "branch-required",
      });
    }

    await ensureBranchExists(supabase, branchId);
    patch.branch_id = branchId;
  }

  if (Object.prototype.hasOwnProperty.call(options.payload, "isActive")) {
    patch.is_active = Boolean(options.payload.isActive);
  }

  const { data, error } = await supabase
    .from("showrooms")
    .update(patch)
    .eq("id", currentShowroom.id)
    .select("id, name, slug, branch_id, is_default, is_active, created_at, updated_at")
    .maybeSingle<ShowroomRow>();

  if (error) throw error;
  if (!data) {
    throw new SettingsDomainError("SHOWROOM_NOT_FOUND", {
      showroomId: currentShowroom.id,
    });
  }

  const branches = await fetchAccessibleBranches(supabase, { context });
  const branchById = new Map(branches.map((entry) => [entry.id, entry]));

  return mapShowroomRow({
    row: data,
    branchById,
  });
}

export async function deleteShowroomForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    showroomId: string;
  }
): Promise<{ success: true }> {
  const context = await resolveSettingsContext(supabase, options.actorProfileId);
  ensureOwnerAdmin(context);

  const currentShowroom = await getShowroomById(supabase, options.showroomId);
  if (!currentShowroom) {
    throw new SettingsDomainError("SHOWROOM_NOT_FOUND", {
      showroomId: options.showroomId,
    });
  }

  if (currentShowroom.is_default) {
    throw new SettingsDomainError("SHOWROOM_DEFAULT_IMMUTABLE", {
      showroomId: options.showroomId,
    });
  }

  const { count, error: usageError } = await supabase
    .from("showroom_page_configs")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", currentShowroom.branch_id)
    .eq("page_key", "PRODUCT_HOME");

  if (usageError) throw usageError;
  if ((count ?? 0) > 0) {
    throw new SettingsDomainError("SHOWROOM_IN_USE", {
      showroomId: currentShowroom.id,
      branchId: currentShowroom.branch_id,
    });
  }

  const { error } = await supabase
    .from("showrooms")
    .update({
      is_delete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentShowroom.id)
    .eq("is_delete", false);

  if (error) throw error;

  return {
    success: true,
  };
}

export async function getPublicSiteBranding(
  supabase: SupabaseClient
): Promise<PublicSiteBrandingDto> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("site_logo_url, site_logo_dark_url, is_makeup_module_enabled")
    .limit(1)
    .maybeSingle<
      Pick<
        SystemSettingsRow,
        "site_logo_url" | "site_logo_dark_url" | "is_makeup_module_enabled"
      >
    >();

  if (error) {
    if (isMissingOptionalSystemSettingsColumnsError(error)) {
      return {
        siteLogoUrl: DEFAULT_SITE_LOGO_URL,
        siteLogoDarkUrl: DEFAULT_SITE_LOGO_DARK_URL,
        isMakeupModuleEnabled: DEFAULT_SYSTEM_SETTINGS.isMakeupModuleEnabled,
      };
    }
    throw error;
  }

  const configuredLightLogo = sanitizeText(data?.site_logo_url ?? null);
  const configuredDarkLogo = sanitizeText(data?.site_logo_dark_url ?? null);

  return {
    siteLogoUrl: configuredLightLogo ?? configuredDarkLogo ?? DEFAULT_SITE_LOGO_URL,
    siteLogoDarkUrl: configuredDarkLogo ?? configuredLightLogo ?? DEFAULT_SITE_LOGO_DARK_URL,
    isMakeupModuleEnabled:
      data?.is_makeup_module_enabled ?? DEFAULT_SYSTEM_SETTINGS.isMakeupModuleEnabled,
  };
}

export async function getPublishedShowroomPageConfig(
  supabase: SupabaseClient,
  options: {
    query: PublicShowroomPageConfigQuery;
  }
): Promise<PublicShowroomPageConfigDto | null> {
  const locale = normalizeLocale(options.query.locale) ?? "vi";
  const showroomContext = await resolvePublicShowroomContext(supabase, {
    showroomSlug: options.query.showroomSlug ?? null,
    branchId: options.query.branchId ?? null,
  });

  if (!showroomContext) return null;

  const fetchConfig = async (localeCandidate: SettingLocale) => {
    const { data, error } = await supabase
      .from("showroom_page_configs")
      .select(
        "id, branch_id, locale, page_key, template_id, title, subtitle, hero_image_path, hero_config_json, sections_config_json, filters_config_json, seo_config_json, display_config_json, is_active, is_published, updated_at"
      )
      .eq("branch_id", showroomContext.branchId)
      .eq("page_key", "PRODUCT_HOME")
      .eq("is_active", true)
      .eq("is_published", true)
      .eq("locale", localeCandidate)
      .maybeSingle<ShowroomPageConfigRow>();

    if (error) throw error;
    return data ?? null;
  };

  let config = await fetchConfig(locale);
  if (!config && locale !== "vi") {
    config = await fetchConfig("vi");
  }

  if (!config) return null;

  const { data: template, error: templateError } = await supabase
    .from("showroom_page_templates")
    .select("code, template_version, is_active")
    .eq("id", config.template_id)
    .maybeSingle<{ code: string; template_version: number; is_active: boolean }>();

  if (templateError) throw templateError;
  if (!template || !template.is_active) return null;

  return {
    showroomId: showroomContext.showroomId,
    showroomSlug: showroomContext.showroomSlug,
    showroomName: showroomContext.showroomName,
    isDefaultShowroom: showroomContext.isDefaultShowroom,
    branchId: config.branch_id,
    locale: normalizeLocale(config.locale) ?? "vi",
    pageKey: "PRODUCT_HOME",
    templateCode: template.code,
    templateVersion: template.template_version,
    title: config.title,
    subtitle: config.subtitle,
    heroImagePath: config.hero_image_path,
    heroConfigJson: config.hero_config_json,
    sectionsConfigJson: config.sections_config_json,
    filtersConfigJson: config.filters_config_json,
    seoConfigJson: config.seo_config_json,
    displayConfigJson: config.display_config_json,
  };
}
