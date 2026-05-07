import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClientAndUser } from "@/lib/supabase/request";
import { createServiceRoleClient } from "@/server/data-access/auth";
import {
  createProductCategoryForAdmin,
  createBranchForAdmin,
  createShowroomForAdmin,
  createSettingsUserForAdmin,
  deleteProductCategoryForAdmin,
  deleteShowroomForAdmin,
  getPublicSiteBranding,
  getPublishedShowroomPageConfig,
  getSettingsGeneralForAdmin,
  getShowroomPagesSettingsForAdmin,
  listProductCategoriesForAdmin,
  listBranchesForAdmin,
  listShowroomsForAdmin,
  listSettingsUsersForAdmin,
  SettingsDomainError,
  updateProductCategoryForAdmin,
  triggerUserPasswordResetForAdmin,
  updateBranchForAdmin,
  updateShowroomForAdmin,
  updateSettingsGeneralForAdmin,
  updateSettingsUserForAdmin,
  updateShowroomPagesSettingsForAdmin,
} from "@/server/data-access/settings";
import { SHOWROOM_ROLE_VALUES, type ShowroomRole } from "@/types/showroomAuth";
import type {
  LateFeeMode,
  SettingLocale,
  SettingsCreateShowroomPayload,
  SettingsCreateUserPayload,
  SettingsCreateProductCategoryPayload,
  SettingsCustomerTagInput,
  SettingsGeneralUpdatePayload,
  SettingsOpeningHourDto,
  SettingsProductCategoryInput,
  SettingsProductCategoriesQuery,
  SettingsResetUserPasswordPayload,
  SettingsShowroomPagesUpdatePayload,
  SettingsUpdateBranchPayload,
  SettingsUpdateProductCategoryPayload,
  SettingsUpdateShowroomPayload,
  SettingsUpdateUserPayload,
} from "@/types/settingsModule";

const SETTING_LOCALE_SET = new Set<SettingLocale>(["vi", "en"]);
const LATE_FEE_MODE_SET = new Set<LateFeeMode>(["fixed_per_day", "percent_per_day"]);
const SHOWROOM_ROLE_SET = new Set<ShowroomRole>(SHOWROOM_ROLE_VALUES);

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseSettingLocale(value: unknown): SettingLocale | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !SETTING_LOCALE_SET.has(text as SettingLocale)) return null;
  return text as SettingLocale;
}

function parseLateFeeMode(value: unknown): LateFeeMode | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !LATE_FEE_MODE_SET.has(text as LateFeeMode)) return null;
  return text as LateFeeMode;
}

function parseShowroomRole(value: unknown): ShowroomRole | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !SHOWROOM_ROLE_SET.has(text as ShowroomRole)) return null;
  return text as ShowroomRole;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const text = parseString(entry);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }

  return output;
}

function parseOpeningHours(value: unknown): SettingsOpeningHourDto[] | null {
  if (!Array.isArray(value)) return null;

  const output: SettingsOpeningHourDto[] = [];

  for (const entry of value) {
    const row = parseRecord(entry);
    if (!row) return null;

    const dayOfWeek = parseNumber(row.dayOfWeek);
    const isOpen = parseBoolean(row.isOpen);

    if (dayOfWeek === undefined || isOpen === undefined) {
      return null;
    }

    output.push({
      dayOfWeek,
      isOpen,
      openTime: row.openTime === null ? null : parseString(row.openTime),
      closeTime: row.closeTime === null ? null : parseString(row.closeTime),
      breakStartTime: row.breakStartTime === null ? null : parseString(row.breakStartTime),
      breakEndTime: row.breakEndTime === null ? null : parseString(row.breakEndTime),
    });
  }

  return output;
}

function parseProductCategories(value: unknown): SettingsProductCategoryInput[] | null {
  if (!Array.isArray(value)) return null;

  const output: SettingsProductCategoryInput[] = [];

  for (const entry of value) {
    const row = parseRecord(entry);
    if (!row) return null;

    const code = parseString(row.code);
    const name = parseString(row.name);
    const isActive = parseBoolean(row.isActive);

    if (!code || !name || isActive === undefined) {
      return null;
    }

    output.push({
      id: parseString(row.id) ?? undefined,
      code,
      name,
      isActive,
    });
  }

  return output;
}

function parseCustomerTags(value: unknown): SettingsCustomerTagInput[] | null {
  if (!Array.isArray(value)) return null;

  const output: SettingsCustomerTagInput[] = [];

  for (const entry of value) {
    const row = parseRecord(entry);
    if (!row) return null;

    const code = parseString(row.code);
    const name = parseString(row.name);
    const isActive = parseBoolean(row.isActive);
    if (!code || !name || isActive === undefined) {
      return null;
    }

    output.push({
      id: parseString(row.id) ?? undefined,
      code,
      name,
      color: row.color === null ? null : parseString(row.color),
      warnOnOrderCreate: parseBoolean(row.warnOnOrderCreate),
      blockOrderCreate: parseBoolean(row.blockOrderCreate),
      isActive,
    });
  }

  return output;
}

function parseSettingsGeneralUpdatePayload(
  body: Record<string, unknown>
): SettingsGeneralUpdatePayload | null {
  const branchId = parseString(body.branchId);
  if (!branchId) return null;

  const payload: SettingsGeneralUpdatePayload = {
    branchId,
  };

  const systemDefaults = parseRecord(body.systemDefaults);
  if (systemDefaults) {
    const patch: SettingsGeneralUpdatePayload["systemDefaults"] = {};

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "defaultLocale")) {
      const defaultLocale = parseSettingLocale(systemDefaults.defaultLocale);
      if (!defaultLocale) return null;
      patch.defaultLocale = defaultLocale;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "defaultCurrencyCode")) {
      const defaultCurrencyCode = parseString(systemDefaults.defaultCurrencyCode);
      if (!defaultCurrencyCode) return null;
      patch.defaultCurrencyCode = defaultCurrencyCode;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "lateFeeMode")) {
      const lateFeeMode = parseLateFeeMode(systemDefaults.lateFeeMode);
      if (!lateFeeMode) return null;
      patch.lateFeeMode = lateFeeMode;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "lateFeeValue")) {
      const lateFeeValue = parseNumber(systemDefaults.lateFeeValue);
      if (lateFeeValue === undefined) return null;
      patch.lateFeeValue = lateFeeValue;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "laundryTrackingEnabled")) {
      const laundryTrackingEnabled = parseBoolean(systemDefaults.laundryTrackingEnabled);
      if (laundryTrackingEnabled === undefined) return null;
      patch.laundryTrackingEnabled = laundryTrackingEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "isShippingModuleEnabled")) {
      const isShippingModuleEnabled = parseBoolean(systemDefaults.isShippingModuleEnabled);
      if (isShippingModuleEnabled === undefined) return null;
      patch.isShippingModuleEnabled = isShippingModuleEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "isMakeupModuleEnabled")) {
      const isMakeupModuleEnabled = parseBoolean(systemDefaults.isMakeupModuleEnabled);
      if (isMakeupModuleEnabled === undefined) return null;
      patch.isMakeupModuleEnabled = isMakeupModuleEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "isZaloMiniAppEnabled")) {
      const isZaloMiniAppEnabled = parseBoolean(systemDefaults.isZaloMiniAppEnabled);
      if (isZaloMiniAppEnabled === undefined) return null;
      patch.isZaloMiniAppEnabled = isZaloMiniAppEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "siteLogoUrl")) {
      patch.siteLogoUrl =
        systemDefaults.siteLogoUrl === null ? null : parseString(systemDefaults.siteLogoUrl);
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, "siteLogoDarkUrl")) {
      patch.siteLogoDarkUrl =
        systemDefaults.siteLogoDarkUrl === null
          ? null
          : parseString(systemDefaults.siteLogoDarkUrl);
    }

    payload.systemDefaults = patch;
  }

  const branchPolicy = parseRecord(body.branchPolicy);
  if (branchPolicy) {
    const patch: SettingsGeneralUpdatePayload["branchPolicy"] = {};

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "locale")) {
      const locale = parseSettingLocale(branchPolicy.locale);
      if (!locale) return null;
      patch.locale = locale;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "currencyCode")) {
      const currencyCode = parseString(branchPolicy.currencyCode);
      if (!currencyCode) return null;
      patch.currencyCode = currencyCode;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "lateFeeMode")) {
      const lateFeeMode = parseLateFeeMode(branchPolicy.lateFeeMode);
      if (!lateFeeMode) return null;
      patch.lateFeeMode = lateFeeMode;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "lateFeeValue")) {
      const lateFeeValue = parseNumber(branchPolicy.lateFeeValue);
      if (lateFeeValue === undefined) return null;
      patch.lateFeeValue = lateFeeValue;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "laundryTrackingEnabled")) {
      const laundryTrackingEnabled = parseBoolean(branchPolicy.laundryTrackingEnabled);
      if (laundryTrackingEnabled === undefined) return null;
      patch.laundryTrackingEnabled = laundryTrackingEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "isRentalModuleEnabled")) {
      const isRentalModuleEnabled = parseBoolean(branchPolicy.isRentalModuleEnabled);
      if (isRentalModuleEnabled === undefined) return null;
      patch.isRentalModuleEnabled = isRentalModuleEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "isMakeupModuleEnabled")) {
      const isMakeupModuleEnabled = parseBoolean(branchPolicy.isMakeupModuleEnabled);
      if (isMakeupModuleEnabled === undefined) return null;
      patch.isMakeupModuleEnabled = isMakeupModuleEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "overdueReminderThresholdHours")) {
      const overdueReminderThresholdHours = parseNumber(branchPolicy.overdueReminderThresholdHours);
      if (overdueReminderThresholdHours === undefined) return null;
      patch.overdueReminderThresholdHours = overdueReminderThresholdHours;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, "laundryStuckThresholdDays")) {
      const laundryStuckThresholdDays = parseNumber(branchPolicy.laundryStuckThresholdDays);
      if (laundryStuckThresholdDays === undefined) return null;
      patch.laundryStuckThresholdDays = laundryStuckThresholdDays;
    }

    payload.branchPolicy = patch;
  }

  if (Object.prototype.hasOwnProperty.call(body, "openingHours")) {
    const openingHours = parseOpeningHours(body.openingHours);
    if (!openingHours) return null;
    payload.openingHours = openingHours;
  }

  if (Object.prototype.hasOwnProperty.call(body, "productCategories")) {
    const productCategories = parseProductCategories(body.productCategories);
    if (!productCategories) return null;
    payload.productCategories = productCategories;
  }

  if (Object.prototype.hasOwnProperty.call(body, "customerTags")) {
    const customerTags = parseCustomerTags(body.customerTags);
    if (!customerTags) return null;
    payload.customerTags = customerTags;
  }

  return payload;
}

function parseShowroomPagesUpdatePayload(
  body: Record<string, unknown>
): SettingsShowroomPagesUpdatePayload | null {
  const branchId = parseString(body.branchId);
  const locale = parseSettingLocale(body.locale);
  const templateId = parseString(body.templateId);

  if (!branchId || !locale || !templateId) {
    return null;
  }

  const payload: SettingsShowroomPagesUpdatePayload = {
    branchId,
    locale,
    templateId,
  };

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    payload.title = body.title === null ? null : parseString(body.title);
  }

  if (Object.prototype.hasOwnProperty.call(body, "subtitle")) {
    payload.subtitle = body.subtitle === null ? null : parseString(body.subtitle);
  }

  if (Object.prototype.hasOwnProperty.call(body, "heroImagePath")) {
    payload.heroImagePath = body.heroImagePath === null ? null : parseString(body.heroImagePath);
  }

  if (Object.prototype.hasOwnProperty.call(body, "heroConfigJson")) {
    payload.heroConfigJson = body.heroConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sectionsConfigJson")) {
    payload.sectionsConfigJson = body.sectionsConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, "filtersConfigJson")) {
    payload.filtersConfigJson = body.filtersConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, "seoConfigJson")) {
    payload.seoConfigJson = body.seoConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, "displayConfigJson")) {
    payload.displayConfigJson = body.displayConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isPublished")) {
    const isPublished = parseBoolean(body.isPublished);
    if (isPublished === undefined) return null;
    payload.isPublished = isPublished;
  }

  return payload;
}

function parseCreateUserPayload(
  body: Record<string, unknown>
): SettingsCreateUserPayload | null {
  const email = parseString(body.email)?.toLowerCase() ?? null;
  const role = parseShowroomRole(body.role);
  const branchIds = parseStringArray(body.branchIds);

  if (!email || !role || !branchIds) return null;

  let locale: SettingLocale | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(body, "locale")) {
    const parsedLocale = parseSettingLocale(body.locale);
    if (!parsedLocale) return null;
    locale = parsedLocale;
  }

  return {
    email,
    password: body.password === undefined ? undefined : parseString(body.password),
    fullName: body.fullName === undefined ? undefined : parseString(body.fullName),
    phone: body.phone === undefined ? undefined : parseString(body.phone),
    role,
    defaultBranchId:
      body.defaultBranchId === undefined ? undefined : parseString(body.defaultBranchId),
    branchIds,
    locale,
    redirectTo: body.redirectTo === undefined ? undefined : parseString(body.redirectTo),
  };
}

function parseUpdateUserPayload(body: Record<string, unknown>): SettingsUpdateUserPayload | null {
  const payload: SettingsUpdateUserPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, "fullName")) {
    payload.fullName = body.fullName === null ? null : parseString(body.fullName);
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    payload.phone = body.phone === null ? null : parseString(body.phone);
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    const role = parseShowroomRole(body.role);
    if (!role) return null;
    payload.role = role;
  }

  if (Object.prototype.hasOwnProperty.call(body, "defaultBranchId")) {
    payload.defaultBranchId =
      body.defaultBranchId === null ? null : parseString(body.defaultBranchId);
  }

  if (Object.prototype.hasOwnProperty.call(body, "branchIds")) {
    const branchIds = parseStringArray(body.branchIds);
    if (!branchIds) return null;
    payload.branchIds = branchIds;
  }

  if (Object.prototype.hasOwnProperty.call(body, "locale")) {
    const locale = parseSettingLocale(body.locale);
    if (!locale) return null;
    payload.locale = locale;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

function parseResetUserPasswordPayload(
  body: Record<string, unknown>
): SettingsResetUserPasswordPayload | null {
  const newPassword = parseString(body.newPassword);
  if (!newPassword) return null;

  return {
    newPassword,
  };
}

function parseCreateBranchPayload(body: Record<string, unknown>) {
  const code = parseString(body.code);
  const name = parseString(body.name);

  if (!code || !name) return null;

  return {
    code,
    name,
    address: body.address === undefined ? undefined : parseString(body.address),
    phone: body.phone === undefined ? undefined : parseString(body.phone),
    timezone: body.timezone === undefined ? undefined : parseString(body.timezone),
    currencyCode:
      body.currencyCode === undefined ? undefined : parseString(body.currencyCode),
  };
}

function parseUpdateBranchPayload(body: Record<string, unknown>): SettingsUpdateBranchPayload | null {
  const payload: SettingsUpdateBranchPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "address")) {
    payload.address = body.address === null ? null : parseString(body.address);
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    payload.phone = body.phone === null ? null : parseString(body.phone);
  }

  if (Object.prototype.hasOwnProperty.call(body, "timezone")) {
    payload.timezone = body.timezone === null ? null : parseString(body.timezone);
  }

  if (Object.prototype.hasOwnProperty.call(body, "currencyCode")) {
    payload.currencyCode = body.currencyCode === null ? null : parseString(body.currencyCode);
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

function parseCreateShowroomPayload(
  body: Record<string, unknown>
): SettingsCreateShowroomPayload | null {
  const name = parseString(body.name);
  const branchId = parseString(body.branchId);

  if (!name || !branchId) {
    return null;
  }

  const payload: SettingsCreateShowroomPayload = {
    name,
    branchId,
  };

  if (Object.prototype.hasOwnProperty.call(body, "slug")) {
    payload.slug = body.slug === null ? null : parseString(body.slug);
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

function parseUpdateShowroomPayload(
  body: Record<string, unknown>
): SettingsUpdateShowroomPayload | null {
  const payload: SettingsUpdateShowroomPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "slug")) {
    const slug = parseString(body.slug);
    if (!slug) return null;
    payload.slug = slug;
  }

  if (Object.prototype.hasOwnProperty.call(body, "branchId")) {
    const branchId = parseString(body.branchId);
    if (!branchId) return null;
    payload.branchId = branchId;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

function parseCreateProductCategoryPayload(
  body: Record<string, unknown>
): SettingsCreateProductCategoryPayload | null {
  const code = parseString(body.code);
  const name = parseString(body.name);

  if (!code || !name) {
    return null;
  }

  const payload: SettingsCreateProductCategoryPayload = {
    code,
    name,
  };

  if (Object.prototype.hasOwnProperty.call(body, "branchId")) {
    payload.branchId = body.branchId === null ? null : parseString(body.branchId);
  }

  if (Object.prototype.hasOwnProperty.call(body, "sortOrder")) {
    const sortOrder = parseNumber(body.sortOrder);
    if (sortOrder === undefined) return null;
    payload.sortOrder = sortOrder;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

function parseUpdateProductCategoryPayload(
  body: Record<string, unknown>
): SettingsUpdateProductCategoryPayload | null {
  const payload: SettingsUpdateProductCategoryPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, "code")) {
    const code = parseString(body.code);
    if (!code) return null;
    payload.code = code;
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sortOrder")) {
    const sortOrder = parseNumber(body.sortOrder);
    if (sortOrder === undefined) return null;
    payload.sortOrder = sortOrder;
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
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
  if (error instanceof SettingsDomainError) {
    const payload =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === "FORBIDDEN_SETTINGS_ACCESS" ||
      error.code === "FORBIDDEN_BRANCH_SCOPE"
    ) {
      return NextResponse.json(payload, { status: 403 });
    }

    if (
      error.code === "BRANCH_NOT_FOUND" ||
      error.code === "USER_NOT_FOUND" ||
      error.code === "TEMPLATE_NOT_FOUND" ||
      error.code === "SHOWROOM_NOT_FOUND" ||
      error.code === "PRODUCT_CATEGORY_NOT_FOUND"
    ) {
      return NextResponse.json(payload, { status: 404 });
    }

    if (error.code === "EMAIL_SENDER_DISABLED") {
      return NextResponse.json(payload, { status: 503 });
    }

    if (
      error.code === "MISSING_BRANCH_CONTEXT" ||
      error.code === "CANNOT_DISABLE_SELF" ||
      error.code === "OWNER_ADMIN_ROLE_IS_SEED_ONLY" ||
      error.code === "OWNER_ADMIN_ROLE_IMMUTABLE" ||
      error.code === "TEMPLATE_INACTIVE" ||
      error.code === "PROFILE_EMAIL_MISSING" ||
      error.code === "SHOWROOM_DEFAULT_IMMUTABLE" ||
      error.code === "SHOWROOM_IN_USE" ||
      error.code === "SHOWROOM_SLUG_DUPLICATE" ||
      error.code === "PRODUCT_CATEGORY_CODE_DUPLICATE" ||
      error.code === "PRODUCT_CATEGORY_IN_USE"
    ) {
      return NextResponse.json(payload, { status: 409 });
    }

    return NextResponse.json(payload, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function handleGetSettingsGeneral(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const payload = await getSettingsGeneralForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get("branchId")),
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

export async function handlePatchSettingsGeneral(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseSettingsGeneralUpdatePayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await updateSettingsGeneralForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetSettingsShowroomPages(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;
    const localeRaw = searchParams.get("locale");
    const locale = localeRaw ? parseSettingLocale(localeRaw) : null;

    if (localeRaw && !locale) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const payload = await getShowroomPagesSettingsForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get("branchId")),
        locale,
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

export async function handlePatchSettingsShowroomPages(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseShowroomPagesUpdatePayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await updateShowroomPagesSettingsForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetSettingsUsers(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;
    let serviceRoleClient: ReturnType<typeof createServiceRoleClient> | undefined;
    try {
      serviceRoleClient = createServiceRoleClient();
    } catch {
      serviceRoleClient = undefined;
    }

    const payload = await listSettingsUsersForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get("branchId")),
      },
      serviceRoleClient,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostSettingsUser(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseCreateUserPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const serviceRoleClient = createServiceRoleClient();

    const result = await createSettingsUserForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
      serviceRoleClient,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchSettingsUser(request: NextRequest, userId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseUpdateUserPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const serviceRoleClient = createServiceRoleClient();

    const result = await updateSettingsUserForAdmin(supabase, {
      actorProfileId: profileId,
      userId,
      payload,
      serviceRoleClient,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostSettingsUserResetPassword(
  request: NextRequest,
  userId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = parseResetUserPasswordPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const serviceRoleClient = createServiceRoleClient();

    const result = await triggerUserPasswordResetForAdmin(supabase, {
      actorProfileId: profileId,
      userId,
      payload,
      serviceRoleClient,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetSettingsBranches(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const payload = await listBranchesForAdmin(supabase, {
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

export async function handlePostSettingsBranch(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseCreateBranchPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await createBranchForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchSettingsBranch(request: NextRequest, branchId: string) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseUpdateBranchPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await updateBranchForAdmin(supabase, {
      actorProfileId: profileId,
      branchId,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetSettingsProductCategories(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = request.nextUrl.searchParams;

    const query: SettingsProductCategoriesQuery = {
      branchId: parseString(searchParams.get("branchId")),
    };

    const payload = await listProductCategoriesForAdmin(supabase, {
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

export async function handlePostSettingsProductCategory(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseCreateProductCategoryPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await createProductCategoryForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchSettingsProductCategory(
  request: NextRequest,
  productCategoryId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseUpdateProductCategoryPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await updateProductCategoryForAdmin(supabase, {
      actorProfileId: profileId,
      productCategoryId,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleDeleteSettingsProductCategory(
  request: NextRequest,
  productCategoryId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const result = await deleteProductCategoryForAdmin(supabase, {
      actorProfileId: profileId,
      productCategoryId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetSettingsShowrooms(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const payload = await listShowroomsForAdmin(supabase, {
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

export async function handlePostSettingsShowroom(request: NextRequest) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseCreateShowroomPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await createShowroomForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchSettingsShowroom(
  request: NextRequest,
  showroomId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseUpdateShowroomPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await updateShowroomForAdmin(supabase, {
      actorProfileId: profileId,
      showroomId,
      payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleDeleteSettingsShowroom(
  request: NextRequest,
  showroomId: string
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const result = await deleteShowroomForAdmin(supabase, {
      actorProfileId: profileId,
      showroomId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetPublishedShowroomConfig(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const localeRaw = searchParams.get("locale");
    const locale = localeRaw ? parseSettingLocale(localeRaw) : "vi";

    if (!locale) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const payload = await getPublishedShowroomPageConfig(supabase, {
      query: {
        showroomSlug: parseString(searchParams.get("showroomSlug")),
        branchId: parseString(searchParams.get("branchId")),
        locale,
      },
    });

    return NextResponse.json(payload);
  } catch (error) {
    return mapDomainError(error);
  }
}

export async function handleGetPublicSiteBranding() {
  try {
    const supabase = createServiceRoleClient();
    const payload = await getPublicSiteBranding(supabase);
    return NextResponse.json(payload);
  } catch (error) {
    return mapDomainError(error);
  }
}
