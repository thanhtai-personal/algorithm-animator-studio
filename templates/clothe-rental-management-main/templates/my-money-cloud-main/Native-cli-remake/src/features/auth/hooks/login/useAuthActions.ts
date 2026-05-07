import { useCallback, useMemo, useRef } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { clearSyncedUser } from "@/lib/appLock";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import storageAdapter from "@/lib/storageAdapter";
import { authStore } from "@/store/authStore";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { statsStore } from "@/store/statsStore";
import { syncingStore } from "@/store/syncingStore";
import { appLockStore } from "@/features/auth/stores/AppLockStore";
import { categoryService } from "@/features/categories/services/categoryService";
import { transactionService } from "@/features/transactions/services/transactionService";
import { fetchUserSettingsFromApi } from "@/features/profile/services/userSettingsService";
import { mergeUserSettings } from "@/features/auth/utils/userSettingsSync";
import type { FormState } from "@/features/auth/types/authScreen";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";

WebBrowser.maybeCompleteAuthSession();

const parseAuthParams = (url: string) => {
  const params = new URLSearchParams();
  const addParams = (segment?: string) => {
    if (!segment) return;
    const trimmed = segment.startsWith("?") || segment.startsWith("#") ? segment.slice(1) : segment;
    if (!trimmed) return;
    const parsed = new URLSearchParams(trimmed);
    parsed.forEach((value, key) => params.set(key, value));
  };
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");
  if (queryIndex >= 0) {
    addParams(url.slice(queryIndex));
  }
  if (hashIndex >= 0) {
    addParams(url.slice(hashIndex));
  }
  return params;
};

export interface AuthActionsHandlers {
  handleSubmit: (
    mode: "signIn" | "signUp",
    form: FormState,
    loading: boolean,
    setLoading: (loading: boolean) => void
  ) => Promise<void>;
  handleGoogleSignIn: (loading: boolean, setLoading: (loading: boolean) => void) => Promise<void>;
  handleGuestSignIn: (loading: boolean, setLoading: (loading: boolean) => void) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  exitAnonymous: () => void;
  completeOAuth: (url: string) => Promise<void>;
  bootstrapSession: (onSession: (userId: string) => Promise<boolean> | boolean) => Promise<() => void>;
}

function clearLocalAppData(userId: string | null, anonId: string | null) {
  if (userId) {
    offlineQueueStore.clear(userId);
    categoryStore.clearForUser(userId);
    transactionStore.clearForUser(userId);
  }
  if (anonId && anonId !== userId) {
    offlineQueueStore.clear(anonId);
    categoryStore.clearForUser(anonId);
    transactionStore.clearForUser(anonId);
  }
  statsStore.clear();
  authStore.clearUserSession();
  authStore.clearAnonymousSession();
  appLockStore.reset();
  clearSyncedUser();
  syncingStore.reset();
  storageAdapter.clearAll();
}

export function useAuthActions(): AuthActionsHandlers {
  const router = useRouter();
  const supabase = useMemo(() => (isSupabaseConfigured ? getSupabaseBrowserClient() : null), []);
  const pendingOAuth = useRef(false);

  const loadRemoteData = useCallback(async () => {
    const categories = await categoryService.list();
    categoryStore.write(categories);
    const now = new Date();
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const transactions = await transactionService.listByRange({ start: lastYear, end: now });
    transactionStore.write(transactions);
  }, []); 

  const hydrateUserSession = useCallback(
    async (userId: string) => {
      if (!supabase) return false;
      const remoteSettings = await fetchUserSettingsFromApi().catch(() => null);
      if (!remoteSettings) {
        const anonId = authStore.anonId;
        await supabase.auth.signOut();
        clearLocalAppData(userId, anonId);
        return false;
      }
      const mergedSettings = mergeUserSettings(userId, authStore.userSettings, remoteSettings);
      authStore.setUserSession(userId, mergedSettings);
      try {
        await loadRemoteData();
      } catch {
        // Remote data fetch failures should not block session hydration.
      }
      return true;
    },
    [loadRemoteData, mergeUserSettings, supabase]
  );

  const resolveAuthRedirectUrl = useCallback(() => Linking.createURL("auth-callback"), []);

  const completeOAuth = useCallback(
    async (url: string) => {
      if (!supabase) return;
      pendingOAuth.current = false;
      const params = parseAuthParams(url);
      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      } catch (error) {
        // ignore oauth errors to avoid blocking the flow
      }
    },
    [supabase]
  );

  const handleSubmit = useCallback(
    async (mode: "signIn" | "signUp", form: FormState, loading: boolean, setLoading: (loading: boolean) => void) => {
      if (loading || !supabase) return;
      if (mode === "signUp" && form.password !== form.confirmPassword) {
        Alert.alert("Sign up failed", "Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        if (mode === "signIn") {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (error) {
            Alert.alert("Sign in failed", error.message);
            return;
          }
          if (data?.user) {
            authStore.updateUser({
              displayName: data.user.user_metadata?.display_name ?? null,
              email: data.user.email ?? null,
              phone: data.user.phone ?? null,
              provider: data.user.app_metadata?.provider ?? null,
              providerType: data.user.app_metadata?.provider_type ?? null,
            });
          }
          return;
        }

        const metadata: Record<string, string> = {};
        const trimmedDisplayName = form.displayName.trim();
        const trimmedPhone = form.phone.trim();
        if (trimmedDisplayName) {
          metadata.display_name = trimmedDisplayName;
        }
        if (trimmedPhone) {
          metadata.phone = trimmedPhone;
        }

        const redirectTo = resolveAuthRedirectUrl();
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: metadata,
            emailRedirectTo: redirectTo ?? undefined,
          },
        });
        if (error) {
          Alert.alert("Sign up failed", error.message);
        } else if (data?.user) {
          authStore.updateUser({
            displayName: data.user.user_metadata?.display_name ?? null,
            email: data.user.email ?? null,
            phone: data.user.phone ?? null,
            provider: data.user.app_metadata?.provider ?? null,
            providerType: data.user.app_metadata?.provider_type ?? null,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [resolveAuthRedirectUrl, supabase]
  );

  const handleGoogleSignIn = useCallback(
    async (loading: boolean, setLoading: (loading: boolean) => void) => {
      if (loading || !supabase) return;
      if (!isSupabaseConfigured) {
        Alert.alert("Missing config", "Supabase config is missing.");
        return;
      }
      setLoading(true);
      try {
        const redirectTo = resolveAuthRedirectUrl();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        } as any);
        if (error || !data?.url) {
          Alert.alert("Google sign-in failed", error?.message ?? "Unknown error");
          return;
        }
        pendingOAuth.current = true;
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === "success" && result.url) {
          await completeOAuth(result.url);
        }
      } finally {
        setLoading(false);
      }
    },
    [completeOAuth, resolveAuthRedirectUrl, supabase]
  );

  const handleGuestSignIn = useCallback(
    async (loading: boolean, setLoading: (loading: boolean) => void) => {
      if (loading) return;
      setLoading(true);
      try {
        if (authStore.anonId) {
          router.replace("/(tabs)");
          return;
        }
        const anonId =
          typeof globalThis.crypto?.randomUUID === "function"
            ? `${globalThis.crypto.randomUUID()}`
            : `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        authStore.initAnonymousSession(anonId, {
          currency: null,
          language: "vi",
          theme_mode: "light",
          theme_variant: DEFAULT_THEME_VARIANT,
        });
        router.replace("/(tabs)");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) return;
      const redirectTo = resolveAuthRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        Alert.alert("Reset failed", error.message);
      } else {
        Alert.alert("Reset email sent", "Check your inbox for the reset link.");
      }
    },
    [resolveAuthRedirectUrl, supabase]
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabase) return;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert("Update failed", error.message);
      } else {
        Alert.alert("Password updated", "Your password was updated.");
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } finally {
      const userId = authStore.userId;
      const anonId = authStore.anonId;
      clearLocalAppData(userId, anonId);
      router.replace("/auth");
    }
  }, [router, supabase]);

  const exitAnonymous = useCallback(() => {
    router.push("/auth");
  }, [router]);

  const bootstrapSession = useCallback(
    async (onSession: (userId: string) => Promise<boolean> | boolean) => {
      const handleSession = async (userId: string) => {
        if (authStore.anonId) {
          return onSession(userId);
        }
        return hydrateUserSession(userId);
      };
      if (!supabase) return () => {};
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          void handleSession(session.user.id);
          return;
        }
        if (!authStore.userId) return;
        if (authStore.anonId) {
          authStore.userId = null;
          return;
        }
        const currentUserId = authStore.userId;
        const currentAnonId = authStore.anonId;
        clearLocalAppData(currentUserId, currentAnonId);
      });
      const unsubscribe = () => data.subscription.unsubscribe();

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await handleSession(sessionData.session.user.id);
      } else if (authStore.userId) {
        if (authStore.anonId) {
          authStore.userId = null;
        } else {
          const currentUserId = authStore.userId;
          const currentAnonId = authStore.anonId;
          clearLocalAppData(currentUserId, currentAnonId);
        }
      }

      return unsubscribe;
    },
    [hydrateUserSession, supabase]
  );

  return {
    handleSubmit,
    handleGoogleSignIn,
    handleGuestSignIn,
    requestPasswordReset,
    updatePassword,
    signOut,
    exitAnonymous,
    completeOAuth,
    bootstrapSession,
  };
}
