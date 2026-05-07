"use client";

import { useEffect } from "react";
import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import storageAdapter from "@/lib/storageAdapter";
import { authStore } from "@/store/authStore";
import { authBrowserService } from "@/features/auth/services/authBrowserService";
import { useAuthMutations } from "@/features/auth/queries/useAuthMutations";
import { buildAuthUserSettings } from "@/features/auth/utils/sessionUserSettings";
import { buildPermissionsForRole } from "@/features/auth/utils/permissions";

function restoreAnonymousSettings() {
  const anonId = authStore.anonId;
  if (!anonId) {
    authStore.userSettings = null;
    return;
  }

  authStore.userSettings = storageAdapter.getUserInfo(anonId);
}

function syncSessionUser(user: User | null) {
  if (!user) {
    if (!authStore.userId) return;
    authStore.clearUserSession();
    restoreAnonymousSettings();
    return;
  }

  const nextSettings = buildAuthUserSettings(user, authStore.userSettings);
  authStore.setUserSession(user.id, nextSettings);
}

export function useAuthBootstrap() {
  const { getCurrentSessionMutation, getCurrentAuthContextMutation } = useAuthMutations();
  const getCurrentSession = getCurrentSessionMutation.mutateAsync;
  const getCurrentAuthContext = getCurrentAuthContextMutation.mutateAsync;

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let profileRequestId = 0;

    const syncProfileContext = async (user: User | null, options?: { background?: boolean }) => {
      if (!user) {
        authStore.clearProfileContext();
        return;
      }

      const requestId = ++profileRequestId;
      const hasReadyProfileForSameUser =
        authStore.profileLoadStatus === "ready" && authStore.userId === user.id;
      const shouldMarkLoading = !options?.background || !hasReadyProfileForSameUser;

      if (shouldMarkLoading) {
        authStore.markProfileLoading();
      }

      try {
        const context = await getCurrentAuthContext();
        if (cancelled || requestId !== profileRequestId || authStore.userId !== user.id) {
          return;
        }

        const permissions = buildPermissionsForRole(context.profile?.role ?? null);
        authStore.setProfileContext(context, permissions);

        if (context.profile?.locale) {
          authStore.upsert({ language: context.profile.locale });
        }
      } catch {
        if (cancelled || requestId !== profileRequestId || authStore.userId !== user.id) {
          return;
        }
        if (shouldMarkLoading) {
          authStore.markProfileLoadError();
        }
      }
    };

    const syncAuthContext = async (
      user: User | null,
      options?: { backgroundProfileRefresh?: boolean }
    ) => {
      syncSessionUser(user);
      await syncProfileContext(user, { background: options?.backgroundProfileRefresh });
    };

    const shouldRefreshInBackground = (event: AuthChangeEvent, user: User | null): boolean => {
      if (!user) return false;
      if (authStore.userId !== user.id) return false;
      if (authStore.profileLoadStatus !== "ready") return false;
      return event === "TOKEN_REFRESHED" || event === "SIGNED_IN";
    };

    const bootstrap = async () => {
      try {
        authStore.load();

        const session = await getCurrentSession();
        if (!cancelled) {
          await syncAuthContext(session?.user ?? null);
        }

        unsubscribe = authBrowserService.subscribeToAuthChanges((event, nextSession) => {
          if (cancelled) return;
          const user = nextSession?.user ?? null;
          void syncAuthContext(user, {
            backgroundProfileRefresh: shouldRefreshInBackground(event, user),
          });
        });
      } catch {
        // Keep local session state if browser auth bootstrap fails.
      } finally {
        if (!cancelled) {
          authStore.isBootstrapped = true;
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [getCurrentAuthContext, getCurrentSession]);
}
