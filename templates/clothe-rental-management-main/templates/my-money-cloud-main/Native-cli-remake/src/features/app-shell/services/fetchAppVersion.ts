import { apiFetch } from "@/lib/api";
import { getAppVersion, getPlatformName } from "@/lib/appVersion";

export type AppVersionResponse = {
  latest_version: string;
  min_version: string;
  force_update: boolean;
  store_url: string | null;
  message?: string | null;
};

export async function fetchAppVersion(): Promise<AppVersionResponse | null> {
  try {
    const current = encodeURIComponent(getAppVersion());
    const platform = encodeURIComponent(getPlatformName());
    console.info("[VersionGate] Checking app version", { platform, current });
    const response = await apiFetch(`/app/version?platform=${platform}&current=${current}`, {
      cache: "no-store",
    });
    console.info("[VersionGate] Version check response", { ok: response.ok, status: response.status });
    if (!response.ok) return null;
    const data = await response.json();
    console.info("[VersionGate] Version payload", data);
    return data as AppVersionResponse;
  } catch (error) {
    console.warn("[VersionGate] Failed to fetch app version", error);
    return null;
  }
}
