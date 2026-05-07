import { ZERO_VERSION } from "../constants";
import { apiFetch } from "@/lib/api";

export async function fetchResetVersion(): Promise<string | null> {
  try {
    const response = await apiFetch("/api/force-reset", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    const version = String(data?.version ?? ZERO_VERSION);
    return version;
  } catch (error) {
    console.warn("[ForceResetGuard] Failed to fetch reset version", error);
    return null;
  }
}
