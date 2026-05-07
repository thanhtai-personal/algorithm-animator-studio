export type AuthValue = {
  user: import("@supabase/supabase-js").User | null;
  session: import("@supabase/supabase-js").Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAnonymous: boolean;
  anonKey: string | null;
  enableAnonymous: () => Promise<void>;
  exitAnonymous: () => Promise<void>;
  anonymousDecisionPending: boolean;
  confirmAnonymousSync: () => Promise<boolean>;
  discardAnonymousData: () => Promise<void>;
  cancelAnonymousLogin: () => Promise<void>;
  accountSwitchPending: boolean;
  confirmAccountSwitchErase: () => Promise<void>;
  confirmAccountSwitchSync: () => Promise<boolean>;
  cancelAccountSwitch: () => Promise<void>;
  isOnline: boolean;
};

export type AuthControllerResult = {
  value: AuthValue;
  settingsLoading: boolean;
  sessionUserExists: boolean;
  loadingMessage: string;
};
