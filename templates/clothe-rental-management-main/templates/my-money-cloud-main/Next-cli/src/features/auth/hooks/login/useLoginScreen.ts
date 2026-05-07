import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

import type {
  AuthCopy,
  AuthMode,
  AuthScreenDerived,
  AuthScreenHandlers,
  AuthScreenState,
  AuthView,
} from "@/features/auth/types/authScreen";
import {
  buildAuthCopy,
  buildHeaderSubtitle,
  buildHeaderTitle,
  isResetConfirmView,
  isResetRequestView,
  isSignInMode,
  isSuccessView,
  showGuestOption,
} from "@/features/auth/utils/authScreenUtils";

import { useLoginForm } from "./useLoginForm";
import { useOAuthMessageListener } from "./useOAuthMessageListener";
import { usePasswordResetFlow } from "./usePasswordResetFlow";
import { useAuthActions } from "./useAuthActions";

/**
 * useLoginScreen - Main orchestrator for login screen logic
 * 
 * Composed of focused sub-hooks:
 * - useLoginForm: Form state
 * - useOAuthMessageListener: OAuth message handling
 * - usePasswordResetFlow: Password reset workflow
 * - useAuthActions: Auth API calls
 */
export function useLoginScreen(): {
  state: AuthScreenState;
  derived: AuthScreenDerived;
  copy: AuthCopy;
  handlers: AuthScreenHandlers;
} {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [view, setView] = useState<AuthView>("form");
  const [loading, setLoading] = useState(false);

  // Use composed hooks
  const { form, updateField, resetFormField } = useLoginForm();
  useOAuthMessageListener();
  const { resetSent, handleResetRequest, handleResetConfirm, goToResetRequest, returnToForm } =
    usePasswordResetFlow(form.email, loading, setLoading);
  const { handleSubmit: submitAuth, handleGoogleSignIn: oauthGoogleSignIn, handleGuestSignIn: oauthGuestSignIn } =
    useAuthActions();

  // Handle recovery URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    if (params.get("type") === "recovery") {
      setView("resetConfirm");
      setMode("signIn");
    }
  }, []);

  // Derived state
  const isSignIn = isSignInMode(mode);
  const isResetRequest = isResetRequestView(view);
  const isResetConfirm = isResetConfirmView(view);
  const isSuccess = isSuccessView(view);
  const guestOptionVisible = showGuestOption(view);

  const headerTitle = useMemo(
    () => buildHeaderTitle({ isSuccess, isResetRequest, isResetConfirm, t }),
    [isResetConfirm, isResetRequest, isSuccess, t]
  );

  const headerSubtitle = useMemo(
    () => buildHeaderSubtitle({ isSuccess, isResetRequest, isResetConfirm, t }),
    [isResetConfirm, isResetRequest, isSuccess, t]
  );

  const copy: AuthCopy = useMemo(() => buildAuthCopy({ headerTitle, headerSubtitle, t }), [headerSubtitle, headerTitle, t]);

  // Wrapped handlers
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitAuth(mode, form, loading, setLoading);
      // Handle sign up success view
      if (mode === "signUp" && !loading) {
        setView("signupSuccess");
      }
    },
    [submitAuth, mode, form, loading]
  );

  const handleResetConfirmSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await handleResetConfirm(form.resetPassword, form.resetConfirmPassword);
      resetFormField("resetPassword", "resetConfirmPassword");
      setView("form");
      setMode("signIn");
    },
    [handleResetConfirm, form.resetPassword, form.resetConfirmPassword, resetFormField]
  );

  const handleGoogleSignInClick = useCallback(async () => {
    await oauthGoogleSignIn(loading, setLoading);
  }, [oauthGoogleSignIn, loading]);

  const handleGuestSignInClick = useCallback(async () => {
    await oauthGuestSignIn(loading, setLoading);
  }, [oauthGuestSignIn, loading]);

  const toggleModeClick = useCallback(() => {
    setMode((prev) => (prev === "signIn" ? "signUp" : "signIn"));
    resetFormField("confirmPassword", "displayName", "phone");
    setView("form");
  }, [resetFormField]);

  const completeSignUpSuccess = useCallback(() => {
    setView("form");
    setMode("signIn");
  }, []);

  return {
    state: {
      mode,
      view,
      resetSent,
      loading,
      form,
    },
    derived: {
      isSignIn,
      isResetRequest,
      isResetConfirm,
      isSuccess,
      showGuestOption: guestOptionVisible,
    },
    copy,
    handlers: {
      updateField,
      goToResetRequest,
      returnToForm,
      toggleMode: toggleModeClick,
      completeSignUpSuccess,
      handleSubmit,
      handleResetRequest,
      handleResetConfirm: handleResetConfirmSubmit,
      handleGoogleSignIn: handleGoogleSignInClick,
      handleGuestSignIn: handleGuestSignInClick,
    },
  };
}
