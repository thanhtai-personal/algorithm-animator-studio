import type { MutableRefObject } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AnonymousStateDeps } from "@/features/auth/types/anonymousState";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
};

export type LogoutContext = {
  userId: string | null;
  pendingCount: number;
  hasLocalData: boolean;
};

export type DisplayNameFallbackParams = {
  sessionUser: User | null | undefined;
  supabaseClient: SupabaseClient | null;
  isSupabaseAnonymous: boolean;
};

export type AuthSideEffectsParams = {
  supabaseClient: SupabaseClient | null;
  sessionUser: User | null | undefined;
  isSupabaseAnonymous: boolean;
  isLocalAnonymous: boolean;
  anonKey: string | null;
  loadLocalDataSummary: AnonymousStateDeps["loadLocalDataSummary"];
  setAnonymousDecisionPending: (pending: boolean) => void;
  syncAnonymousData: AnonymousStateDeps["syncAnonymousData"];
  exitAnonymous: AnonymousStateDeps["exitAnonymous"];
  getDeviceDataSummary: AnonymousStateDeps["getDeviceDataSummary"];
  clearDeviceCachedData: AnonymousStateDeps["clearDeviceCachedData"];
  accountSwitchPending: boolean;
  setSettingsLoading: (value: boolean) => void;
  settingsFetchedUserId: MutableRefObject<string | null>;
  setAccountSwitchPending: (pending: boolean) => void;
  setAccountSwitchEmail: (email: string | null) => void;
  setAccountSwitchUserIds: (ids: string[]) => void;
  cachedUser: User | null;
  t: (key: string) => string;
};
