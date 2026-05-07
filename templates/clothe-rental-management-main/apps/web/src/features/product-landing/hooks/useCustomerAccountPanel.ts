"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { authStore } from "@/store/authStore";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useAuthMutations } from "@/features/auth/queries/useAuthMutations";
import { buildPermissionsForRole } from "@/features/auth/utils/permissions";
import {
  useCustomerAccountProfileQuery,
  useUpdateCustomerAccountProfileMutation,
} from "@/features/product-landing/queries/useCustomerAccountQueries";
import { customerAccountStore } from "@/features/product-landing/stores/customerAccountStore";
import type { CustomerAccountProfileDto, UpdateCustomerAccountProfilePayload } from "@/types/customerAccount";

function sanitizeText(value: string): string {
  return value.trim();
}

function mapProfileUpdateErrorMessage(t: (key: string) => string, error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.trim().toUpperCase();

  if (normalized === "EMAIL_IN_USE") {
    return t("customerAccount.emailInUse");
  }
  if (normalized === "PHONE_IN_USE") {
    return t("customerAccount.phoneInUse");
  }
  if (normalized === "INVALID_EMAIL") {
    return t("customerAccount.invalidEmail");
  }
  if (normalized === "INVALID_PHONE") {
    return t("customerAccount.invalidPhone");
  }
  if (normalized === "FORBIDDEN" || normalized === "FORBIDDEN_ROLE") {
    return t("customerAccount.profileUpdateFailed");
  }

  return message || t("customerAccount.profileUpdateFailed");
}

function mapAuthProfileToCustomerAccount(
  authProfile: ReturnType<typeof useAuthAccess>["profile"]
): CustomerAccountProfileDto | null {
  if (!authProfile) return null;

  return {
    id: authProfile.id,
    fullName: authProfile.fullName ?? null,
    email: authProfile.email ?? null,
    phone: authProfile.phone ?? null,
    role: authProfile.role ?? null,
    locale: authProfile.locale ?? null,
    isActive: authProfile.isActive,
  };
}

export function useCustomerAccountPanel() {
  const { t } = useI18n();
  const {
    hasCloudSession,
    role,
    profile: authProfile,
  } = useAuthAccess();
  const {
    confirmPasswordResetMutation,
    getCurrentAuthContextMutation,
  } = useAuthMutations();

  const showPanel = hasCloudSession && role === "customer";
  const profileQuery = useCustomerAccountProfileQuery({ enabled: showPanel });
  const updateProfileMutation = useUpdateCustomerAccountProfileMutation();

  const fallbackProfile = useMemo(
    () => mapAuthProfileToCustomerAccount(authProfile),
    [authProfile]
  );

  const profile = customerAccountStore.profile ?? fallbackProfile;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const refreshAuthContext = useCallback(async () => {
    try {
      const context = await getCurrentAuthContextMutation.mutateAsync();
      const permissions = buildPermissionsForRole(context.profile?.role ?? null);
      authStore.setProfileContext(context, permissions);
      if (context.profile?.locale) {
        authStore.upsert({ language: context.profile.locale });
      }
    } catch {
      // Keep current UI state if profile context refresh fails.
    }
  }, [getCurrentAuthContextMutation]);

  const submitProfile = useCallback(async (draft: {
    fullName: string;
    email: string;
    phone: string;
  }) => {
    if (!profile) return;

    const payload: UpdateCustomerAccountProfilePayload = {};
    const nextFullName = sanitizeText(draft.fullName);
    const nextEmail = sanitizeText(draft.email).toLowerCase();
    const nextPhone = sanitizeText(draft.phone);
    const currentFullName = profile.fullName ?? "";
    const currentEmail = (profile.email ?? "").toLowerCase();
    const currentPhone = profile.phone ?? "";

    if (nextFullName !== currentFullName) {
      payload.fullName = nextFullName;
    }
    if (nextEmail !== currentEmail) {
      payload.email = nextEmail;
    }
    if (nextPhone !== currentPhone) {
      payload.phone = nextPhone;
    }

    if (Object.keys(payload).length === 0) {
      toast.error(t("customerAccount.noChanges"));
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(payload);
      await refreshAuthContext();
      toast.success(t("customerAccount.profileUpdated"));
    } catch (error) {
      toast.error(mapProfileUpdateErrorMessage(t, error));
    }
  }, [
    profile,
    refreshAuthContext,
    t,
    updateProfileMutation,
  ]);

  const profileFormKey = profile
    ? `${profile.id}:${profile.fullName ?? ""}:${profile.email ?? ""}:${profile.phone ?? ""}`
    : "customer-account-profile-empty";

  const submitPassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t("auth.missingFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("customerAccount.passwordTooShort"));
      return;
    }

    try {
      await confirmPasswordResetMutation.mutateAsync({ password: newPassword });
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("auth.passwordUpdated"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("customerAccount.passwordUpdateFailed");
      toast.error(message || t("customerAccount.passwordUpdateFailed"));
    }
  }, [confirmPassword, confirmPasswordResetMutation, newPassword, t]);

  return {
    showPanel,
    profile,
    isLoadingProfile: showPanel && profileQuery.isLoading && !profile,
    isSavingProfile: updateProfileMutation.isPending,
    isUpdatingPassword: confirmPasswordResetMutation.isPending,
    profileFormKey,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    submitProfile,
    submitPassword,
  };
}
