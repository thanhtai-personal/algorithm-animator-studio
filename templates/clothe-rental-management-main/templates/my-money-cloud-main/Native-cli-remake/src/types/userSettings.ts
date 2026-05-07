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

export interface UserSettings {
  user_id?: string;
  currency: string | null;
  theme?: string | null;
  theme_mode?: string | null;
  theme_variant: string | null;
  language?: string | null;
  background_type?: string | null;
  background_value?: string | null;
  pro_mode?: boolean;
  ai_trial_used: boolean;
  ai_requests_remaining: number;
  ignore_voice_verify?: boolean;
  use_ai?: boolean;
  // From user_security_settings table
  screen_lock_enabled?: boolean;
  screen_lock_method?: string | null;
  screen_lock_pin_hash?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  provider?: string | null;
  providerType?: string | null;
  anon_sync_state?: AnonymousSyncState | null;
  anon_key?: string | null;
}
