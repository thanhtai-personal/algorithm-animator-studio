import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";

export async function fetchUserSettingsFromApi() {
  const headers = await getSupabaseAuthHeaders();
  const res = await apiFetch("/api/user/settings", { headers });
  if (!res.ok) throw new Error("Failed to fetch user settings");
  const { settings, securitySettings, auth } = await res.json();
  return { ...(settings ?? {}), ...(securitySettings ?? {}), ...(auth ?? {}) };
}
