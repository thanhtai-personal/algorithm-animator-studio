"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { resolveSiteUrl } from "@/lib/supabase/config";
import { authStore } from "@/store/authStore";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";
import type { FormState, SignInMethod } from "@/features/auth/types/authScreen";
import { useAuthMutations } from "@/features/auth/queries/useAuthMutations";
import { buildPermissionsForRole } from "@/features/auth/utils/permissions";
import {
  resolveClientAuthLocale,
  resolvePostAuthDestination,
} from "@/features/auth/utils/authRedirect";
import { buildAuthUserSettings, createAnonymousSessionId } from "@/features/auth/utils/sessionUserSettings";
import { localizePathname } from "@/utils/locale";
import { validatePhoneNumber } from "@/utils/validation/phone";

type SetLoading = (loading: boolean) => void;

export function useAuthActions() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const {
    signInMutation,
    signUpMutation,
    signInWithGoogleMutation,
    getCurrentAuthContextMutation,
  } = useAuthMutations();

  const handleSubmit = useCallback(
    async (
      mode: "signIn" | "signUp",
      form: FormState,
      signInMethod: SignInMethod,
      loading: boolean,
      setLoading: SetLoading
    ) => {
      if (loading) return;

      if (!form.password) {
        toast.error(t("auth.missingFields"));
        return;
      }

      if (mode === "signIn") {
        if (signInMethod === "email" && !form.email.trim()) {
          toast.error(t("auth.missingFields"));
          return;
        }

        if (signInMethod === "phone") {
          const phoneValidation = validatePhoneNumber(form.phone.trim(), {
            allowEmpty: false,
          });

          if (!phoneValidation.isValid) {
            toast.error(t("auth.phoneInvalid"));
            return;
          }
        }
      } else if (!form.email.trim()) {
        toast.error(t("auth.missingFields"));
        return;
      }

      if (mode === "signUp") {
        if (!form.confirmPassword) {
          toast.error(t("auth.missingFields"));
          return;
        }
        if (form.password !== form.confirmPassword) {
          toast.error(t("auth.passwordMismatch"));
          return;
        }
      }

      setLoading(true);
      try {
        if (mode === "signIn") {
          const payload =
            signInMethod === "phone"
              ? {
                  phone: form.phone.trim(),
                  password: form.password,
                }
              : {
                  email: form.email.trim(),
                  password: form.password,
                };

          const data = await signInMutation.mutateAsync(payload);

          if (data.user) {
            authStore.setUserSession(data.user.id, buildAuthUserSettings(data.user, authStore.userSettings));
          }

          let profileRole: string | null = null;
          let profileLocale: string | null = null;
          let profileBranchId: string | null = null;
          let profileBranchAccess: typeof authStore.branchAccess = [];

          try {
            const context = await getCurrentAuthContextMutation.mutateAsync();
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
            // Fallback redirect is still resolved by app-metadata role + locale cookie/path.
          }

          const appMetadataRole =
            typeof data.user?.app_metadata?.role === "string"
              ? data.user.app_metadata.role
              : null;

          const redirectTarget = resolvePostAuthDestination({
            pathname,
            role: profileRole ?? appMetadataRole,
            profileLocale,
            profileBranchId,
            branchAccess: profileBranchAccess,
          });

          router.replace(redirectTarget);
          return;
        }

        const metadata: Record<string, string> = {};
        const displayName = form.displayName.trim();
        const phone = form.phone.trim();
        if (displayName) metadata.display_name = displayName;
        if (phone) metadata.phone = phone;

        const redirectTo = resolveSiteUrl();
        const data = await signUpMutation.mutateAsync({
          email: form.email,
          password: form.password,
          metadata,
          emailRedirectTo: redirectTo ?? undefined,
        });

        if (!data.user || !data.session) {
          return;
        }

        authStore.setUserSession(data.user.id, buildAuthUserSettings(data.user, authStore.userSettings));

        let profileRole: string | null = null;
        let profileLocale: string | null = null;
        let profileBranchId: string | null = null;
        let profileBranchAccess: typeof authStore.branchAccess = [];

        try {
          const context = await getCurrentAuthContextMutation.mutateAsync();
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
          // Keep fallback redirect when profile context is unavailable right after sign-up.
        }

        const appMetadataRole =
          typeof data.user?.app_metadata?.role === "string"
            ? data.user.app_metadata.role
            : null;

        const redirectTarget = resolvePostAuthDestination({
          pathname,
          role: profileRole ?? appMetadataRole,
          profileLocale,
          profileBranchId,
          branchAccess: profileBranchAccess,
        });

        router.replace(redirectTarget);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("toast.saveFailed");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [getCurrentAuthContextMutation, pathname, router, signInMutation, signUpMutation, t]
  );

  const handleGoogleSignIn = useCallback(
    async (loading: boolean, setLoading: SetLoading) => {
      if (loading) return;

      setLoading(true);
      try {
        const baseUrl = resolveSiteUrl();
        const locale = resolveClientAuthLocale({ pathname });
        const callbackPath = localizePathname("/auth/callback", locale);
        const redirectTo = baseUrl
          ? `${baseUrl.replace(/\/$/, "")}${callbackPath}`
          : undefined;
        const data = await signInWithGoogleMutation.mutateAsync({ redirectTo });

        if (data.url) {
          window.location.assign(data.url);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t("toast.saveFailed");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [pathname, signInWithGoogleMutation, t]
  );

  const handleGuestSignIn = useCallback(
    async (loading: boolean, setLoading: SetLoading) => {
      if (loading) return;

      setLoading(true);
      try {
        const redirectTarget = resolvePostAuthDestination({
          pathname,
          role: null,
          profileLocale: null,
        });

        if (authStore.anonId) {
          router.replace(redirectTarget);
          return;
        }

        authStore.initAnonymousSession(createAnonymousSessionId(), {
          currency: null,
          language: "vi",
          theme_mode: "light",
          theme_variant: DEFAULT_THEME_VARIANT,
        });

        router.replace(redirectTarget);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("toast.saveFailed");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [pathname, router, t]
  );

  return {
    handleSubmit,
    handleGoogleSignIn,
    handleGuestSignIn,
  };
}
