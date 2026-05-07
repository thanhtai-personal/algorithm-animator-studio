"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LOCALE_COOKIE_NAME, type AppLocale, DEFAULT_LOCALE } from "@/constants/locale";
import { localizePathname, extractLocaleFromPathname } from "@/utils/locale";

function buildLocaleCookie(nextLocale: AppLocale): string {
  return `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function useLocaleSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLocale = useMemo(
    () => extractLocaleFromPathname(pathname) ?? DEFAULT_LOCALE,
    [pathname]
  );

  const getLocaleHref = useCallback(
    (nextLocale: AppLocale) => {
      const nextPathname = localizePathname(pathname, nextLocale);
      const query = searchParams.toString();
      return query ? `${nextPathname}?${query}` : nextPathname;
    },
    [pathname, searchParams]
  );

  const switchLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (nextLocale === currentLocale) return;

      if (typeof document !== "undefined") {
        document.cookie = buildLocaleCookie(nextLocale);
      }

      router.push(getLocaleHref(nextLocale));
    },
    [currentLocale, getLocaleHref, router]
  );

  return {
    currentLocale,
    getLocaleHref,
    switchLocale,
  };
}
