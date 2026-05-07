"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { resolveSiteUrl } from "@/lib/supabase/config";
import { useAuthMutations } from "@/features/auth/queries/useAuthMutations";
import { resolveClientAuthLocale } from "@/features/auth/utils/authRedirect";
import { localizePathname } from "@/utils/locale";

interface ResetFlowState {
  resetSent: boolean;
}

interface ResetFlowHandlers {
  handleResetRequest: () => Promise<void>;
  handleResetConfirm: (resetPassword: string, resetConfirmPassword: string) => Promise<void>;
  goToResetRequest: () => void;
  returnToForm: () => void;
}

/**
 * usePasswordResetFlow - Manages password reset workflow
 * 
 * Responsibilities:
 * - Request password reset via email
 * - Confirm password reset with new password
 * - Track reset sent status
 * - Navigate reset flow UI
 */
export function usePasswordResetFlow(
  email: string,
  loading: boolean,
  setLoading: (loading: boolean) => void
): ResetFlowState & ResetFlowHandlers {
  const pathname = usePathname();
  const { t } = useI18n();
  const { requestPasswordResetMutation, confirmPasswordResetMutation } = useAuthMutations();
  const [resetSent, setResetSent] = useState(false);

  const handleResetRequest = useCallback(async () => {
    if (!email) {
      toast.error(t("auth.missingFields"));
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const siteUrl = resolveSiteUrl();
      const locale = resolveClientAuthLocale({ pathname });
      const authPath = localizePathname("/auth", locale);
      const redirectTo = siteUrl ? `${siteUrl.replace(/\/$/, "")}${authPath}` : undefined;
      await requestPasswordResetMutation.mutateAsync({ email, redirectTo });
      setResetSent(true);
      toast.success(t("auth.resetEmailSent"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("toast.saveFailed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [email, loading, pathname, requestPasswordResetMutation, t, setLoading]);

  const handleResetConfirm = useCallback(
    async (resetPassword: string, resetConfirmPassword: string) => {
      if (!resetPassword || !resetConfirmPassword) {
        toast.error(t("auth.missingFields"));
        return;
      }
      if (resetPassword !== resetConfirmPassword) {
        toast.error(t("auth.passwordMismatch"));
        return;
      }
      if (loading) return;

      setLoading(true);
      try {
        await confirmPasswordResetMutation.mutateAsync({ password: resetPassword });
        toast.success(t("auth.passwordUpdated"));
      } catch (error) {
        const message = error instanceof Error ? error.message : t("toast.saveFailed");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [confirmPasswordResetMutation, loading, t, setLoading]
  );

  const goToResetRequest = useCallback(() => {
    setResetSent(false);
  }, []);

  const returnToForm = useCallback(() => {
    setResetSent(false);
  }, []);

  return {
    resetSent,
    handleResetRequest,
    handleResetConfirm,
    goToResetRequest,
    returnToForm,
  };
}
