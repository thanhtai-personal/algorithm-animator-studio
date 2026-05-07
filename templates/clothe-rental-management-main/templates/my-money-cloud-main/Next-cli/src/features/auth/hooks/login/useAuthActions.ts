"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { clearSyncedUser } from "@/lib/appLock";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveSiteUrl } from "@/lib/supabase/config";
import storageAdapter from "@/lib/storageAdapter";
import { authStore } from "@/store/authStore";
import { categoryStore } from "@/store/categoryStore";
import { transactionStore } from "@/store/transactionStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { statsStore } from "@/store/statsStore";
import { syncingStore } from "@/store/syncingStore";
import type { FormState } from "@/features/auth/types/authScreen";
import { categoryService } from "@/features/categories/services/categoryService";
import { transactionService } from "@/features/transactions/services/transactionService";
import { fetchUserSettingsFromApi } from "@/features/profile/services/userSettingsService";
import { mergeUserSettings } from "@/features/auth/utils/userSettingsSync";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";
import { appLockStore } from "@/features/auth/stores/AppLockStore";

export interface AuthActionsHandlers {
  handleSubmit: (mode: "signIn" | "signUp", form: FormState, loading: boolean, setLoading: (loading: boolean) => void) => Promise<void>;
  handleGoogleSignIn: (loading: boolean, setLoading: (loading: boolean) => void) => Promise<void>;
  handleGuestSignIn: (loading: boolean, setLoading: (loading: boolean) => void) => Promise<void>;
  signOut: (options?: { force?: boolean }) => Promise<void>;
  exitAnonymous: () => void;
  bootstrapSession: (onSession: (userId: string) => Promise<boolean> | boolean) => Promise<() => void>;
  accountSwitchPending: boolean;
  cancelAccountSwitch: () => void;
  confirmAccountSwitchErase: () => void;
  confirmAccountSwitchSync: () => boolean;
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

/**
 * useAuthActions - Handles authentication API calls
 * 
 * Responsibilities:
 * - Sign in with email/password
 * - Sign up with email/password
 * - OAuth sign in (Google)
 * - Guest/anonymous sign in
 */
export function useAuthActions(): AuthActionsHandlers {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

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
    [loadRemoteData, mergeUserSettings, supabase.auth]
  );

  const handleSubmit = useCallback(
    async (mode: "signIn" | "signUp", form: FormState, loading: boolean, setLoading: (loading: boolean) => void) => {
      if (loading) return;

      if (mode === "signUp" && form.password !== form.confirmPassword) {
        toast.error(t("auth.passwordMismatch"));
        return;
      }

      setLoading(true);
      try {
        if (mode === "signIn") {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password
          });
          if (error) {
            toast.error(error.message);
            return;
          }
          // Cập nhật thông tin user vào store
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

        // Sign up mode
        const metadata: Record<string, string> = {};
        const trimmedDisplayName = form.displayName.trim();
        const trimmedPhone = form.phone.trim();
        if (trimmedDisplayName) {
          metadata.display_name = trimmedDisplayName;
        }
        if (trimmedPhone) {
          metadata.phone = trimmedPhone;
        }

        const redirectTo = resolveSiteUrl();
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: metadata,
            emailRedirectTo: redirectTo ?? undefined,
          },
        });
        if (error) {
          toast.error(error.message);
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
    [supabase.auth, t]
  );

  const handleGoogleSignIn = useCallback(
    async (loading: boolean, setLoading: (loading: boolean) => void) => {
      if (loading) return;
      setLoading(true);
      try {
        const baseUrl = resolveSiteUrl();
        const redirectTo = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth/callback` : undefined;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data?.url) {
          window.location.assign(data.url);
        }
      } finally {
        setLoading(false);
      }
    },
    [supabase.auth, t]
  );

  const handleGuestSignIn = useCallback(
    async (loading: boolean, setLoading: (loading: boolean) => void) => {
      if (loading) return;
      setLoading(true);
      try {
        if (authStore.anonId) {
          router.replace("/home");
          return;
        }
        // Tạo anonymous id và lưu vào store
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
        // Persist vào local storage đã được store xử lý
        router.replace("/home");
      } catch (error) {
        console.error("Guest sign-in failed:", error);
        const message = error instanceof Error ? error.message : t("toast.saveFailed");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [router, t]
  );

  const signOut = useCallback(async (options?: { force?: boolean }) => {
    const userId = authStore.userId;
    const anonId = authStore.anonId;
    if (userId && offlineQueueStore.getCount(userId) > 0 && !options?.force) {
      toast.error(t("auth.localDataWarning"));
      return;
    }
    try {
      await supabase.auth.signOut();
    } finally {
      clearLocalAppData(userId, anonId);
      router.replace("/auth");
    }
  }, [supabase.auth, router, t]);

  // Chuyển từ anonymous sang login: giữ nguyên local data, chỉ redirect sang trang login
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
    [hydrateUserSession, supabase.auth]
  );

  // Hủy chuyển account: đóng dialog, không thay đổi dữ liệu, quay lại trạng thái ban đầu
  const cancelAccountSwitch = () => {
    // TODO: Đặt accountSwitchPending = false trong authStore
    // Có thể redirect về trang trước hoặc giữ nguyên
  }

  // Xác nhận xóa toàn bộ local data khi chuyển account
  const confirmAccountSwitchErase = () => {
    // TODO: Xóa toàn bộ dữ liệu local (gọi authStore.clearAccountSwitchData())
    // Đặt accountSwitchPending = false
    // Sau khi xóa, thực hiện đăng nhập với tài khoản mới
    // Có thể redirect về trang home hoặc login
  }

  // Xác nhận đồng bộ dữ liệu local lên cloud cho user mới
  const confirmAccountSwitchSync = () => {
    // TODO: Thực hiện đồng bộ dữ liệu local (gọi authStore.syncAccountSwitchData())
    // Đặt accountSwitchPending = false
    // Sau khi sync, có thể xóa local data nếu cần
    // Trả về true nếu thành công, false nếu thất bại
    return false;
  }

  return {
    handleSubmit,
    handleGoogleSignIn,
    handleGuestSignIn,
    signOut,
    exitAnonymous,
    bootstrapSession,
    accountSwitchPending: false,
    cancelAccountSwitch,
    confirmAccountSwitchErase,
    confirmAccountSwitchSync,
  };
}
