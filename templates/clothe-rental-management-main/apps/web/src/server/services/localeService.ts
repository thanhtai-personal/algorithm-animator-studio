import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/constants/locale";
import { normalizeAppLocale } from "@/utils/locale";

type ProfileLocaleRow = {
  locale: string | null;
};

type ProfileRoleRow = {
  role: string | null;
};

function isAdminRoleValue(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "owner_admin" ||
    normalized === "admin" ||
    normalized === "manager"
  );
}

function resolveLandingSuffixByRole(role: string | null | undefined): string {
  if (typeof role !== "string") return "product";
  const normalized = role.trim().toLowerCase();
  if (normalized === "staff") return "sales/pos";
  if (isAdminRoleValue(normalized)) return "dashboard";
  return "product";
}

async function resolveProfileLocale(): Promise<AppLocale | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .maybeSingle<ProfileLocaleRow>();

    if (error) return null;

    return normalizeAppLocale(data?.locale);
  } catch {
    return null;
  }
}

async function resolveProfileRole(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<ProfileRoleRow>();

    if (error) return null;
    return data?.role ?? null;
  } catch {
    return null;
  }
}

async function resolveCookieLocale(): Promise<AppLocale | null> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null;
  return normalizeAppLocale(cookieLocale);
}

export async function resolvePreferredLocale(): Promise<AppLocale> {
  const profileLocale = await resolveProfileLocale();
  if (profileLocale) return profileLocale;

  const cookieLocale = await resolveCookieLocale();
  if (cookieLocale) return cookieLocale;

  return DEFAULT_LOCALE;
}

export async function resolvePreferredLandingPath(options?: {
  locale?: AppLocale | null;
}): Promise<string> {
  const locale = options?.locale ?? (await resolvePreferredLocale());
  const role = await resolveProfileRole();
  const segment = resolveLandingSuffixByRole(role);
  return `/${locale}/${segment}`;
}
