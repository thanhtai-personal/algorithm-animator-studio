import type { RouteAccessDecision, RouteAuthPolicy } from "@/types/showroomAuth";
import {
  isAdminRoleValue,
  isMakeupArtistRoleValue,
  isSalesRoleValue,
  isSettingsRoleValue,
  normalizeRoleValue,
  resolveRoleHomePath,
} from "@/features/auth/utils/authRedirect";
import { stripLocaleFromPathname } from "@/utils/locale";

type NormalizedRole = ReturnType<typeof normalizeRoleValue>;

const PUBLIC_BRANCH_DOMAIN_RESERVED_SEGMENTS = new Set([
  "api",
  "auth",
  "b",
  "booking",
  "calendar",
  "categories",
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
  "shifts",
  "showroom",
]);

export function isAuthRoutePath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/auth" || normalized.startsWith("/auth/") || normalized === "/login";
}

function isPublicBranchDomainPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  const rootSegment = (segments[0] ?? "").trim().toLowerCase();
  if (!rootSegment || PUBLIC_BRANCH_DOMAIN_RESERVED_SEGMENTS.has(rootSegment)) {
    return false;
  }

  const section = (segments[1] ?? "").trim().toLowerCase();
  if (!section) return true;
  return section === "products" || section === "showroom" || section === "search";
}

export function isPublicShowroomPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  const isBranchPublicPath =
    /^\/b\/[^/]+\/products(?:\/|$)/.test(normalized) ||
    /^\/b\/[^/]+\/showroom(?:\/|$)/.test(normalized) ||
    /^\/b\/[^/]+\/search(?:\/|$)/.test(normalized);

  if (isBranchPublicPath) return true;
  if (isPublicBranchDomainPath(pathname)) return true;

  return (
    normalized === "/product" ||
    normalized.startsWith("/product/") ||
    normalized === "/booking" ||
    normalized.startsWith("/booking/") ||
    normalized === "/showroom" ||
    normalized.startsWith("/showroom/")
  );
}

export function isSalesPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/sales" || normalized.startsWith("/sales/");
}

export function isSettingsPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/settings" || normalized.startsWith("/settings/");
}

export function isProcurementPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/procurement" || normalized.startsWith("/procurement/");
}

export function isMakeupPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/makeup" || normalized.startsWith("/makeup/");
}

function isMakeupArtistOnlyPath(pathname: string | null | undefined): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === "/makeup/my-schedule" || normalized === "/makeup/my-stats";
}

export function isCurrentSessionDebugHomePath(pathname: string | null | undefined): boolean {
  return stripLocaleFromPathname(pathname) === "/";
}

export function resolveRouteAuthPolicy(pathname: string | null | undefined): RouteAuthPolicy {
  if (isAuthRoutePath(pathname)) return "auth-only-no-session";
  if (isPublicShowroomPath(pathname)) return "public";
  if (isCurrentSessionDebugHomePath(pathname)) return "public";
  return "cloud-only";
}

export function evaluateRouteAccess(options: {
  pathname: string | null | undefined;
  hasCloudSession: boolean;
  hasGuestSession: boolean;
  role: NormalizedRole;
}): RouteAccessDecision {
  const policy = resolveRouteAuthPolicy(options.pathname);
  const hasSession = options.hasCloudSession || options.hasGuestSession;

  if (policy === "public") {
    return { allowed: true, redirectTo: null, policy };
  }

  if (policy === "auth-only-no-session") {
    const redirectTo = options.hasCloudSession
      ? resolveRoleHomePath(options.role)
      : hasSession
        ? "/product"
        : null;

    return {
      allowed: !hasSession,
      redirectTo,
      policy,
    };
  }

  if (policy === "session-any") {
    return {
      allowed: hasSession,
      redirectTo: hasSession ? null : "/auth",
      policy,
    };
  }

  if (!options.hasCloudSession) {
    return {
      allowed: false,
      redirectTo: hasSession ? "/product" : "/auth",
      policy,
    };
  }

  if (isSalesPath(options.pathname)) {
    if (isSalesRoleValue(options.role)) {
      return { allowed: true, redirectTo: null, policy };
    }

    return {
      allowed: false,
      redirectTo: resolveRoleHomePath(options.role),
      policy,
    };
  }

  if (isSettingsPath(options.pathname) && !isSettingsRoleValue(options.role)) {
    return {
      allowed: false,
      redirectTo: resolveRoleHomePath(options.role),
      policy,
    };
  }

  if (isProcurementPath(options.pathname)) {
    if (isSalesRoleValue(options.role)) {
      return { allowed: true, redirectTo: null, policy };
    }

    return {
      allowed: false,
      redirectTo: resolveRoleHomePath(options.role),
      policy,
    };
  }

  if (isMakeupPath(options.pathname)) {
    if (isMakeupArtistRoleValue(options.role)) {
      if (isMakeupArtistOnlyPath(options.pathname)) {
        return { allowed: true, redirectTo: null, policy };
      }

      return {
        allowed: false,
        redirectTo: "/makeup/my-schedule",
        policy,
      };
    }

    if (
      options.role === "owner_admin" ||
      options.role === "manager" ||
      options.role === "staff"
    ) {
      return { allowed: true, redirectTo: null, policy };
    }

    return {
      allowed: false,
      redirectTo: resolveRoleHomePath(options.role),
      policy,
    };
  }

  if (isAdminRoleValue(options.role)) {
    return { allowed: true, redirectTo: null, policy };
  }

  return {
    allowed: false,
    redirectTo: resolveRoleHomePath(options.role),
    policy,
  };
}
