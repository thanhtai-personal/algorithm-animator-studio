export type AnonymousSyncPhase = "settings" | "categories" | "transactions" | "done";
export type AnonymousSyncStatus = "syncing" | "completed";

export interface AnonymousSyncState {
  status: AnonymousSyncStatus;
  phase: AnonymousSyncPhase;
  settingsTotal: number;
  settingsSynced: boolean;
  categoryIndex: number;
  transactionIndex: number;
  totalCategories: number;
  totalTransactions: number;
  updatedAt: string;
}

/**
 * Columns persisted in current Supabase `user_settings` + `user_security_settings`
 * (plus auth/profile metadata cached on client).
 */
export interface UserSettingsSchemaFields {
  user_id?: string;
  currency: string | null;
  theme?: string | null;
  theme_mode?: string | null;
  theme_variant: string | null;
  language?: string | null;
  background_type?: string | null;
  background_value?: string | null;
  // From user_security_settings table
  screen_lock_enabled?: boolean;
  screen_lock_method?: string | null;
  screen_lock_pin_hash?: string | null;
  // From auth/profile cache on client (not `user_settings` table columns)
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  provider?: string | null;
  providerType?: string | null;
  role?: string | null;
  anon_sync_state?: AnonymousSyncState | null;
  anon_key?: string | null;
}

/**
 * Legacy finance-app local fields kept for compatibility during source-base alignment.
 * They are not part of the current Supabase `user_settings` schema used by this repo.
 */
export interface LegacyUserSettingsCompatFields {
  pro_mode?: boolean;
  ai_trial_used?: boolean;
  ai_requests_remaining?: number;
  ignore_voice_verify?: boolean;
  use_ai?: boolean;
}

export type UserSettings = UserSettingsSchemaFields & LegacyUserSettingsCompatFields;
