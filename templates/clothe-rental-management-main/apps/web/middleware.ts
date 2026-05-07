import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
} from "@/constants/locale";
import {
  extractLocaleFromPathname,
  localizePathname,
  normalizeAppLocale,
} from "@/utils/locale";

const LOCALIZED_ROOT_SEGMENTS = new Set([
  "auth",
  "b",
  "product",
  "showroom",
  "dashboard",
  "orders",
  "inventory",
  "products",
  "customers",
  "payments",
  "calendar",
  "reports",
  "settings",
]);

function getRootSegment(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? null;
}


function writeLocaleCookie(response: NextResponse, locale: string): void {
  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathLocale = extractLocaleFromPathname(pathname);

  if (pathLocale) {
    const response = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE_NAME)?.value !== pathLocale) {
      writeLocaleCookie(response, pathLocale);
    }
    return response;
  }

  const rootSegment = getRootSegment(pathname);
  if (!rootSegment || !LOCALIZED_ROOT_SEGMENTS.has(rootSegment)) {
    return NextResponse.next();
  }

  const cookieLocale =
    normalizeAppLocale(request.cookies.get(LOCALE_COOKIE_NAME)?.value) ??
    DEFAULT_LOCALE;
  const localizedUrl = request.nextUrl.clone();
  localizedUrl.pathname = localizePathname(pathname, cookieLocale);

  const response = NextResponse.redirect(localizedUrl);
  writeLocaleCookie(response, cookieLocale);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
