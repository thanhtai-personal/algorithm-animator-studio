import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type UseAnonymousStateParams = {
  supabaseClient: SupabaseClient | null;
  session: Session | null;
  isSupabaseAnonymous: boolean;
};

export type AnonymousStateDeps = {
  isLocalAnonymous: boolean;
  anonKey: string | null;
  anonymousLoading: boolean;
  anonymousDecisionPending: boolean;
  setAnonymousDecisionPending: (pending: boolean) => void;
  enableLocalAnonymous: () => Promise<void>;
  enableAnonymous: () => Promise<void>;
  exitAnonymous: () => Promise<void>;
  syncAnonymousData: () => Promise<boolean>;
  discardAnonymousData: () => Promise<void>;
  loadLocalDataSummary: () => { hasData: boolean };
  getDeviceDataSummary: () => {
    hasLocalData: boolean;
    hasCachedData: boolean;
    hasPending: boolean;
    userIds: string[];
  };
  prepareDeviceDataForSync: (userIds: string[]) => void;
  clearDeviceCachedData: (userIds: string[]) => void;
};
