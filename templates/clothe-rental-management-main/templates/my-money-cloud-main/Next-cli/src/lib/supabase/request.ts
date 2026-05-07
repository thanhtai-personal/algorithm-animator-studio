import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name) return acc;
    acc[name] = decodeURIComponent(valueParts.join("="));
    return acc;
  }, {});
}

function getProjectRefFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function getSupabaseAccessTokenFromCookie(request: Request): string | null {
  const projectRef = getProjectRefFromUrl(SUPABASE_URL);
  if (!projectRef) return null;

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const baseName = `sb-${projectRef}-auth-token`;
  let raw = cookies[baseName];

  if (!raw) {
    const chunkEntries = Object.entries(cookies)
      .filter(([name]) => name.startsWith(`${baseName}.`))
      .sort(([a], [b]) => {
        const aIndex = Number(a.replace(`${baseName}.`, ""));
        const bIndex = Number(b.replace(`${baseName}.`, ""));
        return aIndex - bIndex;
      });
    if (chunkEntries.length) {
      raw = chunkEntries.map(([, value]) => value).join("");
    }
  }

  if (!raw) return null;
  const encoded = raw.startsWith("base64-") ? raw.slice("base64-".length) : raw;

  try {
    const json = atob(encoded);
    const session = JSON.parse(json);
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export function createSupabaseClientWithToken(token: string): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase config missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function getSupabaseClientAndUser(
  request: Request
): Promise<{ supabase: SupabaseClient; user: User | null; accessToken: string | null }> {
  const accessToken = getBearerToken(request) ?? getSupabaseAccessTokenFromCookie(request);

  if (accessToken) {
    const supabase = createSupabaseClientWithToken(accessToken);
    const { data } = await supabase.auth.getUser();
    return { supabase, user: data.user ?? null, accessToken };
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null, accessToken: null };
}

export function getAccessTokenFromRequest(request: Request): string | null {
  return getBearerToken(request) ?? getSupabaseAccessTokenFromCookie(request);
}
