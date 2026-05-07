import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_AI_FREE_TRIAL_REQUESTS,
} from "@/constants";
import { AISettingsUpdate } from "./types/AISettingsUpdate";

type ClassValue = string | number | null | undefined | false;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export const serializeObject = <T,>(value: T) => JSON.stringify(value);


export async function updateAISettingsRemote(userId: string | null, updates: AISettingsUpdate) {
  if (!userId || !isSupabaseConfigured) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId);

  if (error) {
    // ignore sync failures
  }
}

export function resolveFreeTrialRequests(envValue?: string | null, fallback: number = DEFAULT_AI_FREE_TRIAL_REQUESTS) {
  const parsed = parseInt(envValue ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}
