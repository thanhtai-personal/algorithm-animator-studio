import type { UserSettings } from "@/types/userSettings";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { settingsUpdateStore } from "@/store/settingsUpdateStore";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (typeof data?.error === "string") return data.error;
      if (typeof data?.message === "string") return data.message;
      if (typeof data === "string") return data;
    }
    const text = await response.text();
    if (text) return text;
  } catch {
    // ignore parsing errors
  }
  return `Request failed (${response.status})`;
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  settingsUpdateStore.start();
  try {
    const authHeaders = await getSupabaseAuthHeaders();
    const response = await apiFetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message || "Failed to update user settings");
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
