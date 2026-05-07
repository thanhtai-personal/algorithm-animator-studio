import type { UserSettings } from "@/types/userSettings";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { settingsUpdateStore } from "@/store/settingsUpdateStore";

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  settingsUpdateStore.start();
  try {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      credentials: "include",
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error("Failed to update user settings");
    }
    const body = await response.json();
    if (body?.settings || body?.securitySettings) {
      return { ...(body?.settings ?? {}), ...(body?.securitySettings ?? {}) } as UserSettings;
    }
    return body as UserSettings;
  } finally {
    settingsUpdateStore.end();
  }
}
