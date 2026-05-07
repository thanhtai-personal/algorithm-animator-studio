"use client";

import { useCallback } from "react";
import { authStore } from "@/store/authStore";
import storageAdapter from "@/lib/storageAdapter";
import { useI18n } from "@/lib/i18n";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { useAuthMutations } from "@/features/auth/queries/useAuthMutations";
import { hasPendingOfflineOperations } from "@/features/auth/utils/offlinePending";
import { hasPermission } from "@/features/auth/utils/permissions";

export function useHomeSessionPanel() {
  const { t } = useI18n();
  const { signOutMutation } = useAuthMutations();
  const { confirm } = useAppModal();

  const confirmUnsafeSignOut = useCallback(
    async (sessionOwnerId: string | null) => {
      if (!hasPendingOfflineOperations(sessionOwnerId)) {
        return true;
      }

      return confirm({
        title: t("auth.logoutConfirmTitle"),
        description: t("auth.logoutConfirmDesc"),
        tone: "danger",
      });
    },
    [confirm, t]
  );

  const handleSignOut = useCallback(async () => {
    if (!(await confirmUnsafeSignOut(authStore.userId))) {
      return;
    }

    try {
      await signOutMutation.mutateAsync();
    } catch {
      // Best-effort remote sign-out; local state is cleared below.
    } finally {
      authStore.clearUserSession();
      if (authStore.anonId) {
        authStore.userSettings = storageAdapter.getUserInfo(authStore.anonId);
      }
    }
  }, [confirmUnsafeSignOut, signOutMutation]);

  const handleExitGuest = useCallback(async () => {
    if (!(await confirmUnsafeSignOut(authStore.anonId))) {
      return;
    }
    authStore.clearAnonymousSession();
    if (!authStore.userId) {
      authStore.userSettings = null;
    }
  }, [confirmUnsafeSignOut]);

  return {
    mode: authStore.userId ? "cloud" : authStore.anonId ? "guest" : "none",
    userId: authStore.userId,
    anonId: authStore.anonId,
    currency: authStore.userSettings?.currency ?? null,
    role: authStore.role,
    profileLoadStatus: authStore.profileLoadStatus,
    profileName: authStore.profile?.fullName ?? null,
    profileLocale: authStore.profile?.locale ?? null,
    currentBranchId: authStore.currentBranchId,
    branchAccess: authStore.branchAccess,
    canUpdatePaymentManualStatus: hasPermission(authStore.permissions, "payments.update_status_manual"),
    canManageSettings: hasPermission(authStore.permissions, "settings.manage"),
    hasCloudSession: Boolean(authStore.userId),
    hasGuestSession: Boolean(authStore.anonId),
    handleSignOut,
    handleExitGuest,
  };
}
