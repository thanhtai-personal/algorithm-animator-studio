import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/constants/locale";
import { isReservedPublicShopDomain, normalizeShopDomain } from "@/features/showroom/utils/paths";
import type { ProfileBranchAccess, ShowroomRole } from "@/types/showroomAuth";
import {
  extractLocaleFromPathname,
  localizePathname,
  normalizeAppLocale,
} from "@/utils/locale";

const DASHBOARD_ROLE_SET = new Set(["owner_admin", "admin", "manager", "accountant"]);
const SALES_ROLE_SET = new Set(["owner_admin", "admin", "manager", "staff"]);
const SETTINGS_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);
const MAKEUP_ARTIST_ROLE = "makeup_artist";
const LOCALE_AWARE_REDIRECT_PATHS = new Set([
  "/auth",
  "/dashboard",
  "/makeup",
  "/makeup/my-schedule",
  "/product",
  "/showroom",
  "/sales",
  "/sales/desk",
  "/sales/pos",
]);

export function normalizeRoleValue(value: ShowroomRole | string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function readLocaleFromCookie(): AppLocale | null {
  if (typeof document === "undefined") return null;

  const chunks = document.cookie.split(";");
  for (const chunk of chunks) {
    const [nameRaw, ...valueParts] = chunk.split("=");
    const name = nameRaw?.trim();
    if (name !== LOCALE_COOKIE_NAME) continue;
    const value = valueParts.join("=").trim();
    return normalizeAppLocale(value);
  }

  return null;
}

export function isAdminRoleValue(value: ShowroomRole | string | null | undefined): boolean {
  const normalized = normalizeRoleValue(value);
  if (!normalized) return false;
  return DASHBOARD_ROLE_SET.has(normalized);
}

export function isSettingsRoleValue(value: ShowroomRole | string | null | undefined): boolean {
  const normalized = normalizeRoleValue(value);
  if (!normalized) return false;
  return SETTINGS_ROLE_SET.has(normalized);
}

export function isStaffRoleValue(value: ShowroomRole | string | null | undefined): boolean {
  return normalizeRoleValue(value) === "staff";
}

export function isSalesRoleValue(value: ShowroomRole | string | null | undefined): boolean {
  const normalized = normalizeRoleValue(value);
  if (!normalized) return false;
  return SALES_ROLE_SET.has(normalized);
}

export function isMakeupArtistRoleValue(
  value: ShowroomRole | string | null | undefined
): boolean {
  return normalizeRoleValue(value) === MAKEUP_ARTIST_ROLE;
}

export function resolveRoleHomePath(
  role: ShowroomRole | string | null | undefined
): "/dashboard" | "/sales/pos" | "/makeup/my-schedule" | "/product" {
  const normalized = normalizeRoleValue(role);
  if (!normalized) return "/product";

  if (normalized === MAKEUP_ARTIST_ROLE) return "/makeup/my-schedule";
  if (normalized === "staff") return "/sales/pos";
  if (DASHBOARD_ROLE_SET.has(normalized)) return "/dashboard";

  return "/product";
}

export function resolveClientAuthLocale(options: {
  pathname: string | null | undefined;
  profileLocale?: string | null;
}): AppLocale {
  const localeFromPath = extractLocaleFromPathname(options.pathname);
  if (localeFromPath) return localeFromPath;

  const localeFromCookie = readLocaleFromCookie();
  if (localeFromCookie) return localeFromCookie;

  const localeFromProfile = normalizeAppLocale(options.profileLocale);
  if (localeFromProfile) return localeFromProfile;

  return DEFAULT_LOCALE;
}

export function resolvePostAuthDestination(options: {
  pathname: string | null | undefined;
  role: ShowroomRole | string | null | undefined;
  profileLocale?: string | null;
  profileBranchId?: string | null;
  branchAccess?: ProfileBranchAccess[] | null;
}): string {
  const locale = resolveClientAuthLocale({
    pathname: options.pathname,
    profileLocale: options.profileLocale,
  });

  if (normalizeRoleValue(options.role) === "customer") {
    const profileBranchId =
      typeof options.profileBranchId === "string" ? options.profileBranchId.trim() : "";
    const branchAccess = Array.isArray(options.branchAccess) ? options.branchAccess : [];
    const preferredBranch =
      (profileBranchId ? branchAccess.find((entry) => entry.branchId === profileBranchId) : undefined) ??
      branchAccess.find((entry) => entry.isDefault) ??
      branchAccess[0];
    const branchDomain = normalizeShopDomain(
      preferredBranch?.branchDomain ?? preferredBranch?.shopDomain ?? null
    );

    if (branchDomain && !isReservedPublicShopDomain(branchDomain)) {
      return localizePathname(`/${branchDomain}`, locale);
    }

    return localizePathname("/product", locale);
  }

  const targetPath = resolveRoleHomePath(options.role);
  return localizePathname(targetPath, locale);
}

export function resolveLocaleAwareRedirectTarget(options: {
  redirectTo: string | null;
  pathname: string | null | undefined;
  profileLocale?: string | null;
}): string | null {
  const redirectTo = options.redirectTo;
  if (!redirectTo) return null;

  if (!LOCALE_AWARE_REDIRECT_PATHS.has(redirectTo)) {
    return redirectTo;
  }

  const locale = resolveClientAuthLocale({
    pathname: options.pathname,
    profileLocale: options.profileLocale,
  });

  return localizePathname(redirectTo, locale);
}
