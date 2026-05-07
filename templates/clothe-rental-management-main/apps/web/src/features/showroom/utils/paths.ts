import type { AppLocale } from "@/constants/locale";
import { localizePathname } from "@/utils/locale";

function sanitizeSegment(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeShowroomSlug(value: string | null | undefined): string | null {
  const sanitized = sanitizeSegment(value);
  if (!sanitized) return null;
  return sanitized;
}

export function normalizeBranchSlug(value: string | null | undefined): string | null {
  const sanitized = sanitizeSegment(value);
  if (!sanitized) return null;
  return sanitized;
}

export function normalizeShopDomain(value: string | null | undefined): string | null {
  const sanitized = sanitizeSegment(value);
  if (!sanitized) return null;
  return sanitized;
}

export const PUBLIC_BRANCH_DOMAIN_RESERVED_SEGMENTS = new Set([
  "api",
  "auth",
  "b",
  "booking",
  "calendar",
  "customers",
  "dashboard",
  "inventory",
  "makeup",
  "media",
  "orders",
  "payments",
  "procurement",
  "product",
  "products",
  "reports",
  "sales",
  "search",
  "settings",
  "showroom",
]);

export function isReservedPublicShopDomain(value: string | null | undefined): boolean {
  const normalized = normalizeShopDomain(value);
  if (!normalized) return false;
  return PUBLIC_BRANCH_DOMAIN_RESERVED_SEGMENTS.has(normalized);
}

export function buildBranchProductPath(
  locale: AppLocale,
  branchSlug?: string | null,
  shopDomain?: string | null
): string {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  if (normalizedShopDomain && !isReservedPublicShopDomain(normalizedShopDomain)) {
    return localizePathname(`/${normalizedShopDomain}`, locale);
  }

  const normalizedBranchSlug = normalizeBranchSlug(branchSlug);
  if (!normalizedBranchSlug) {
    return localizePathname("/product", locale);
  }

  if (!isReservedPublicShopDomain(normalizedBranchSlug)) {
    return localizePathname(`/${normalizedBranchSlug}`, locale);
  }

  return localizePathname(`/b/${normalizedBranchSlug}/products`, locale);
}

export function buildShowroomBasePath(
  locale: AppLocale,
  showroomSlug?: string | null,
  branchSlug?: string | null,
  shopDomain?: string | null
): string {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  if (normalizedShopDomain && !isReservedPublicShopDomain(normalizedShopDomain)) {
    return localizePathname(`/${normalizedShopDomain}/showroom`, locale);
  }

  const normalizedBranchSlug = normalizeBranchSlug(branchSlug);
  if (normalizedBranchSlug) {
    if (!isReservedPublicShopDomain(normalizedBranchSlug)) {
      return localizePathname(`/${normalizedBranchSlug}/showroom`, locale);
    }
    return localizePathname(`/b/${normalizedBranchSlug}/showroom`, locale);
  }

  const slug = normalizeShowroomSlug(showroomSlug);
  const route = slug ? `/showroom/${slug}` : "/showroom";
  return localizePathname(route, locale);
}

export function buildShowroomShortlistPath(
  locale: AppLocale,
  showroomSlug?: string | null,
  branchSlug?: string | null,
  shopDomain?: string | null
): string {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  if (normalizedShopDomain && !isReservedPublicShopDomain(normalizedShopDomain)) {
    return localizePathname(`/${normalizedShopDomain}/showroom/shortlist`, locale);
  }

  const normalizedBranchSlug = normalizeBranchSlug(branchSlug);
  if (normalizedBranchSlug) {
    if (!isReservedPublicShopDomain(normalizedBranchSlug)) {
      return localizePathname(`/${normalizedBranchSlug}/showroom/shortlist`, locale);
    }
    return localizePathname(`/b/${normalizedBranchSlug}/showroom/shortlist`, locale);
  }

  const slug = normalizeShowroomSlug(showroomSlug);
  const route = slug ? `/showroom/${slug}/shortlist` : "/showroom/shortlist";
  return localizePathname(route, locale);
}

export function buildShowroomDetailPath(
  locale: AppLocale,
  productId: string,
  showroomSlug?: string | null,
  branchSlug?: string | null,
  shopDomain?: string | null
): string {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  if (normalizedShopDomain && !isReservedPublicShopDomain(normalizedShopDomain)) {
    return localizePathname(`/${normalizedShopDomain}/showroom/p/${productId}`, locale);
  }

  const normalizedBranchSlug = normalizeBranchSlug(branchSlug);
  if (normalizedBranchSlug) {
    if (!isReservedPublicShopDomain(normalizedBranchSlug)) {
      return localizePathname(`/${normalizedBranchSlug}/showroom/p/${productId}`, locale);
    }
    return localizePathname(`/b/${normalizedBranchSlug}/showroom/p/${productId}`, locale);
  }

  const slug = normalizeShowroomSlug(showroomSlug);
  const route = slug
    ? `/showroom/${slug}/p/${productId}`
    : `/showroom/p/${productId}`;
  return localizePathname(route, locale);
}

export function extractShowroomSlugFromPath(pathWithoutLocale: string): string | null {
  const segments = pathWithoutLocale.split("/").filter(Boolean);
  if (segments[0] === "b") {
    if (segments[2] !== "showroom") return null;
    const candidate = segments[3] ?? null;
    if (!candidate || candidate === "shortlist" || candidate === "p") return null;
    return candidate;
  }

  if (segments[0] !== "showroom") return null;

  const candidate = segments[1] ?? null;
  if (!candidate || candidate === "shortlist" || candidate === "p") return null;
  return candidate;
}

export function extractShopDomainFromPath(pathWithoutLocale: string): string | null {
  const segments = pathWithoutLocale.split("/").filter(Boolean);
  const candidate = normalizeShopDomain(segments[0] ?? null);
  if (!candidate || isReservedPublicShopDomain(candidate)) return null;

  const section = segments[1] ?? null;
  if (section === null) {
    return candidate;
  }

  if (section !== "products" && section !== "showroom" && section !== "search") {
    return null;
  }

  return candidate;
}

export function extractBranchSlugFromPath(pathWithoutLocale: string): string | null {
  const segments = pathWithoutLocale.split("/").filter(Boolean);
  if (segments[0] !== "b") return null;
  return normalizeBranchSlug(segments[1] ?? null);
}
