"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { authStore } from "@/store/authStore";
import { useAuthMutations } from "@/features/auth/queries/useAuthMutations";
import { buildPermissionsForRole } from "@/features/auth/utils/permissions";
import { resolvePostAuthDestination } from "@/features/auth/utils/authRedirect";
import { buildAuthUserSettings } from "@/features/auth/utils/sessionUserSettings";

export function useAuthCallbackPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    exchangeCodeForSessionMutation,
    setSessionFromTokensMutation,
    getCurrentAuthContextMutation,
  } = useAuthMutations();

  const exchangeCodeForSession = exchangeCodeForSessionMutation.mutateAsync;
  const setSessionFromTokens = setSessionFromTokensMutation.mutateAsync;
  const getCurrentAuthContext = getCurrentAuthContextMutation.mutateAsync;

  useEffect(() => {
    let cancelled = false;

    const finalize = async (message?: string | null, redirectTo?: string | null) => {
      if (window.opener) {
        window.opener.postMessage(
          { type: "supabase-auth-complete", error: message ?? null },
          window.location.origin
        );
        window.close();
        return;
      }

      router.replace(redirectTo ?? "/");
    };

    const run = async () => {
      let message: string | null = null;
      let redirectTarget = resolvePostAuthDestination({
        pathname: window.location.pathname,
        role: null,
        profileLocale: null,
      });

      const syncSessionUser = (user: User | null | undefined) => {
        if (!user) return;
        authStore.setUserSession(user.id, buildAuthUserSettings(user, authStore.userSettings));
      };

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const code = searchParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        let appMetadataRole: string | null = null;

        if (code) {
          const payload = await exchangeCodeForSession({ code });
          syncSessionUser(payload.user);
          appMetadataRole =
            typeof payload.user?.app_metadata?.role === "string"
              ? payload.user.app_metadata.role
              : null;
        } else if (accessToken && refreshToken) {
          const payload = await setSessionFromTokens({ accessToken, refreshToken });
          syncSessionUser(payload.user);
          appMetadataRole =
            typeof payload.user?.app_metadata?.role === "string"
              ? payload.user.app_metadata.role
              : null;
        }

        let profileRole: string | null = null;
        let profileLocale: string | null = null;
        let profileBranchId: string | null = null;
        let profileBranchAccess: typeof authStore.branchAccess = [];

        try {
          const context = await getCurrentAuthContext();
          const permissions = buildPermissionsForRole(context.profile?.role ?? null);
          authStore.setProfileContext(context, permissions);
          profileRole = context.profile?.role ?? null;
          profileLocale = context.profile?.locale ?? null;
          profileBranchId = context.profile?.branchId ?? context.profile?.defaultBranchId ?? null;
          profileBranchAccess = context.branchAccess;

          if (profileLocale) {
            authStore.upsert({ language: profileLocale });
          }
        } catch {
          // Fallback redirect still works from app metadata role and locale cookie.
        }

        redirectTarget = resolvePostAuthDestination({
          pathname: window.location.pathname,
          role: profileRole ?? appMetadataRole,
          profileLocale,
          profileBranchId,
          branchAccess: profileBranchAccess,
        });
      } catch (error) {
        message = error instanceof Error ? error.message : t("toast.saveFailed");
        if (!cancelled) {
          setErrorMessage(message);
        }
      } finally {
        await finalize(message, redirectTarget);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [exchangeCodeForSession, getCurrentAuthContext, router, setSessionFromTokens, t]);

  return { errorMessage };
}
