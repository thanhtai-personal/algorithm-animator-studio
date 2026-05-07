"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveSiteUrl } from "@/lib/supabase/config";

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
  const { t } = useI18n();
  const supabase = getSupabaseBrowserClient();
  const [resetSent, setResetSent] = useState(false);

  const handleResetRequest = useCallback(async () => {
    if (!email) {
      toast.error(t("auth.missingFields"));
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const redirectTo = resolveSiteUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
      if (error) {
        toast.error(error.message);
        return;
      }
      setResetSent(true);
      toast.success(t("auth.resetEmailSent"));
    } finally {
      setLoading(false);
    }
  }, [email, loading, supabase.auth, t, setLoading]);

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
        const { error } = await supabase.auth.updateUser({ password: resetPassword });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t("auth.passwordUpdated"));
      } finally {
        setLoading(false);
      }
    },
    [loading, supabase.auth, t, setLoading]
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
