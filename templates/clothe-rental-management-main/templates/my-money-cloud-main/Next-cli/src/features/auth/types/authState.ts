import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export type AuthBaseState = {
  supabaseClient: SupabaseClient | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  sessionLoading: boolean;
  setSessionLoading: (loading: boolean) => void;
  cachedUser: User | null;
  setCachedUser: (user: User | null) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
};
